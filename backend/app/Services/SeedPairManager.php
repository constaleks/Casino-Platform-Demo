<?php

namespace App\Services;

use App\Models\GameRound;
use App\Models\SeedPair;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/*
 * Commit-reveal lifecycle of a player's seed pair:
 *
 * 1. The active pair's server_seed_hash is shown to the player BEFORE they play
 *    (the commitment). The server seed itself stays secret.
 * 2. Every round uses (server_seed, client_seed, nonce) and increments the nonce,
 *    so one committed seed yields a fresh, unpredictable result per round.
 * 3. Rotating the pair reveals the old server seed. The player can now check that
 *    sha256(server_seed) matches the hash they were shown, and recompute every
 *    round played with it.
 *
 * The active pair also commits to the NEXT server seed (next_server_seed_hash),
 * and rotation promotes exactly that seed. A new client seed is sent in the same
 * request that rotates, so without this the server would see the client seed
 * before choosing the server seed - and could keep generating seeds until one
 * favours the house. With it, the player checks the new pair's hash against the
 * one shown earlier.
 *
 * Because the seed was fixed before the player picked their client seed, the
 * server has no way to steer an outcome. This is also why the server seed must
 * never leave the server before rotation: with it, every future result of the
 * pair (nonce + 1, + 2, ...) would be predictable. The same goes for the next
 * server seed, which is never revealed at all - it becomes the new active seed.
 */
class SeedPairManager
{
    /*
     * The player's active pair, created on first use. Pass $lock inside a
     * transaction that consumes a nonce, so concurrent spins can't reuse one.
     */
    public static function activeFor(User $user, bool $lock = false): SeedPair
    {
        $pair = self::findActive($user, $lock);

        if ($pair) {
            return $pair;
        }

        /*
         * ON CONFLICT DO NOTHING (via insertOrIgnore) against the partial unique index:
         * two concurrent first requests can't create two active pairs, and the loser
         * doesn't abort the surrounding PostgreSQL transaction the way a caught
         * unique-violation exception would.
         */
        SeedPair::query()->insertOrIgnore(self::freshPairAttributes($user, null));

        return self::findActive($user, $lock);
    }

    /*
     * Reveals the active pair (if any) and starts a new one.
     *
     * @return array{0: SeedPair|null, 1: SeedPair} [revealed pair, new active pair]
     */
    public static function rotate(User $user, ?string $clientSeed = null): array
    {
        return DB::transaction(function () use ($user, $clientSeed) {
            $previous = self::findActive($user, lock: true);
            $committedServerSeed = $previous?->next_server_seed;

            if ($previous) {
                /* Cleared, not kept: from here on it is the new active pair's secret */
                $previous->forceFill(['revealed_at' => now(), 'next_server_seed' => null])->save();
                GameRound::where('seed_pair_id', $previous->id)->update(['server_seed_revealed' => true]);
            }

            $active = SeedPair::forceCreate(self::freshPairAttributes($user, $clientSeed, $committedServerSeed));

            return [$previous, $active];
        });
    }

    /*
     * What the player may see about the active pair - never the server seed
     * or the next one, only their hashes
     */
    public static function publicState(SeedPair $pair): array
    {
        return [
            'server_seed_hash' => $pair->server_seed_hash,
            'next_server_seed_hash' => $pair->next_server_seed_hash,
            'client_seed' => $pair->client_seed,
            'nonce' => $pair->nonce,
        ];
    }

    /*
     * A revealed pair: everything needed to verify its rounds. 'nonce' is the next
     * unused one, so the pair's rounds used nonces 0 .. nonce - 1.
     */
    public static function revealedState(SeedPair $pair): array
    {
        return [
            'server_seed' => $pair->server_seed,
            'server_seed_hash' => $pair->server_seed_hash,
            'client_seed' => $pair->client_seed,
            'nonce' => $pair->nonce,
        ];
    }

    private static function findActive(User $user, bool $lock): ?SeedPair
    {
        $query = SeedPair::where('user_id', $user->id)->whereNull('revealed_at');

        return ($lock ? $query->lockForUpdate() : $query)->first();
    }

    /*
     * $serverSeed is the seed the previous pair committed to. It's null for a player's
     * first pair (no commitment was shown yet), or one that predates next_server_seed.
     */
    private static function freshPairAttributes(User $user, ?string $clientSeed, ?string $serverSeed = null): array
    {
        $serverSeed ??= ProvablyFair::generateServerSeed();
        $nextServerSeed = ProvablyFair::generateServerSeed();

        return [
            'user_id' => $user->id,
            'server_seed' => $serverSeed,
            'server_seed_hash' => ProvablyFair::hashServerSeed($serverSeed),
            'next_server_seed' => $nextServerSeed,
            'next_server_seed_hash' => ProvablyFair::hashServerSeed($nextServerSeed),
            'client_seed' => $clientSeed ?? bin2hex(random_bytes(8)),
            'nonce' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
