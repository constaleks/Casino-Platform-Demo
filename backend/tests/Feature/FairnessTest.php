<?php

namespace Tests\Feature;

use App\Enums\GameType;
use App\Enums\WalletCurrency;
use App\Models\Game;
use App\Models\GameRound;
use App\Models\SeedPair;
use App\Models\User;
use App\Models\Wallet;
use App\Services\ProvablyFair;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
 * Commit-reveal guarantees: the hash is known before play, the seed stays secret
 * while in use, and once revealed it reproduces every round played with it.
 */
class FairnessTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Game $game;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->game = Game::forceCreate([
            'slug' => 'european-roulette',
            'name' => 'European Roulette',
            'type' => GameType::Roulette,
            'is_active' => true,
            'min_bet' => '1.00',
            'max_bet' => '500.00',
            'config' => ['currencies' => [WalletCurrency::Demo->value]],
        ]);
        Wallet::forceCreate(['user_id' => $this->user->id, 'currency' => WalletCurrency::Demo, 'balance' => '1000.00']);
        $this->actingAs($this->user, 'sanctum');
    }

    private function spin()
    {
        return $this->postJson("/api/games/{$this->game->slug}/spin", [
            'bets' => [['bet_type' => 'red', 'bet_value' => [], 'amount' => '1.00']],
        ]);
    }

    public function test_the_hash_is_committed_before_play_without_revealing_the_seed(): void
    {
        $response = $this->getJson('/api/fairness')->assertOk();

        $pair = SeedPair::where('user_id', $this->user->id)->sole();
        $response->assertExactJson(['active' => [
            'server_seed_hash' => hash('sha256', $pair->server_seed),
            'next_server_seed_hash' => hash('sha256', $pair->next_server_seed),
            'client_seed' => $pair->client_seed,
            'nonce' => 0,
        ]]);

        /* Repeated reads return the same commitment, not a new pair */
        $this->getJson('/api/fairness')->assertJsonPath('active.server_seed_hash', $pair->server_seed_hash);
        $this->assertDatabaseCount('seed_pairs', 1);
    }

    public function test_spins_use_the_committed_pair_and_never_expose_its_seed(): void
    {
        $committedHash = $this->getJson('/api/fairness')->json('active.server_seed_hash');

        $first = $this->spin()->assertOk();
        $second = $this->spin()->assertOk();

        $this->assertSame($committedHash, $first->json('round.server_seed_hash'));
        $this->assertSame(0, $first->json('round.nonce'));
        $this->assertSame(1, $second->json('round.nonce'));
        $this->assertSame(2, $second->json('fairness.nonce'));

        foreach ([$first, $second] as $response) {
            $response->assertJsonMissingPath('round.server_seed');
            $response->assertJsonPath('round.server_seed_revealed', false);
        }
    }

    public function test_rotating_reveals_a_seed_that_reproduces_every_round(): void
    {
        $committedHash = $this->getJson('/api/fairness')->json('active.server_seed_hash');
        $results = [];
        for ($i = 0; $i < 3; $i++) {
            $results[] = $this->spin()->json('round.result.number');
        }

        $response = $this->postJson('/api/fairness/rotate', ['client_seed' => 'my-new-seed'])->assertOk();

        $revealed = $response->json('previous');
        $this->assertSame($committedHash, hash('sha256', $revealed['server_seed']));
        $this->assertSame(3, $revealed['nonce']);

        foreach ($results as $nonce => $number) {
            $this->assertSame(
                $number,
                ProvablyFair::resolveNumber($revealed['server_seed'], $revealed['client_seed'], $nonce, 37)
            );
        }

        $this->assertSame(3, GameRound::where('server_seed_revealed', true)->count());

        $response->assertJsonPath('active.client_seed', 'my-new-seed');
        $response->assertJsonPath('active.nonce', 0);
        $this->assertNotSame($committedHash, $response->json('active.server_seed_hash'));
    }

    public function test_rotating_promotes_the_seed_committed_before_the_client_seed_was_chosen(): void
    {
        $committedNextHash = $this->getJson('/api/fairness')->json('active.next_server_seed_hash');
        $committedNextSeed = SeedPair::where('user_id', $this->user->id)->sole()->next_server_seed;

        $response = $this->postJson('/api/fairness/rotate', ['client_seed' => 'chosen-after-commit'])->assertOk();

        $response->assertJsonPath('active.server_seed_hash', $committedNextHash);
        $this->assertNotSame($committedNextHash, $response->json('active.next_server_seed_hash'));

        /* The promoted seed is the new active secret: not in the response, not left on the old pair */
        $this->assertStringNotContainsString($committedNextSeed, $response->getContent());
        $response->assertJsonMissingPath('previous.next_server_seed');
        $this->assertNull(SeedPair::whereNotNull('revealed_at')->sole()->next_server_seed);
    }

    public function test_rotating_without_a_client_seed_generates_one(): void
    {
        $response = $this->postJson('/api/fairness/rotate')->assertOk();

        /* Nothing was active yet, so nothing is revealed */
        $response->assertJsonPath('previous', null);
        $this->assertNotEmpty($response->json('active.client_seed'));
    }

    public function test_it_rejects_an_overlong_client_seed(): void
    {
        $this->postJson('/api/fairness/rotate', ['client_seed' => str_repeat('a', 65)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('client_seed');
    }

    public function test_guests_cannot_read_or_rotate_seeds(): void
    {
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/fairness')->assertUnauthorized();
        $this->postJson('/api/fairness/rotate')->assertUnauthorized();
    }
}
