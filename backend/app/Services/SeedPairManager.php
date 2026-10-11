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
 * Because the seed was fixed before the player picked their client seed, the
 * server has no way to steer an outcome. This is also why the server seed must
 * never leave the server before rotation: with it, every future result of the
 * pair (nonce + 1, + 2, ...) would be predictable.
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

            if ($previous) {
                $previous->forceFill(['revealed_at' => now()])->save();
                GameRound::where('seed_pair_id', $previous->id)->update(['server_seed_revealed' => true]);
            }

            $active = SeedPair::forceCreate(self::freshPairAttributes($user, $clientSeed));

            return [$previous, $active];
        });
    }

    /*
     * What the player may see about the active pair - never the server seed
     */
    public static function publicState(SeedPair $pair): array
    {
        return [
            'server_seed_hash' => $pair->server_seed_hash,
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

    private static function freshPairAttributes(User $user, ?string $clientSeed): array
    {
        $serverSeed = ProvablyFair::generateServerSeed();

        return [
            'user_id' => $user->id,
            'server_seed' => $serverSeed,
            'server_seed_hash' => ProvablyFair::hashServerSeed($serverSeed),
            'client_seed' => $clientSeed ?? bin2hex(random_bytes(8)),
            'nonce' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
