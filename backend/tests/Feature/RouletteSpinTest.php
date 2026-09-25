<?php

namespace Tests\Feature;

use App\Enums\GameType;
use App\Enums\WalletCurrency;
use App\Models\Game;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/*
 * The winning pocket is random by design, so these tests never assert "the ball landed on 17"
 */
class RouletteSpinTest extends TestCase
{
    use RefreshDatabase;

    private const OPENING_BALANCE = '1000.00';

    private User $user;

    private Game $game;

    private Wallet $wallet;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->game = $this->makeGame();
        $this->wallet = $this->makeWallet(WalletCurrency::Demo, self::OPENING_BALANCE);
        $this->actingAs($this->user, 'sanctum');
    }

    /*
     * forceCreate throughout: these models deliberately keep ledger-grade columns
     * out of #[Fillable], so a plain create() would silently drop half of this.
     */
    private function makeGame(array $overrides = []): Game
    {
        return Game::forceCreate(array_merge([
            'slug' => 'european-roulette',
            'name' => 'European Roulette',
            'type' => GameType::Roulette,
            'is_active' => true,
            'min_bet' => '1.00',
            'max_bet' => '500.00',
            'config' => ['currencies' => [
                WalletCurrency::Demo->value,
                WalletCurrency::Usd->value,
            ]],
        ], $overrides));
    }

    private function makeWallet(WalletCurrency $currency, string $balance, ?User $owner = null): Wallet
    {
        return Wallet::forceCreate([
            'user_id' => ($owner ?? $this->user)->id,
            'currency' => $currency,
            'balance' => $balance,
        ]);
    }

    private function spin(array $bets, array $payload = []): TestResponse
    {
        return $this->postJson(
            "/api/games/{$this->game->slug}/spin",
            array_merge(['bets' => $bets], $payload)
        );
    }

    private function bet(string $type, string $amount = '1.00', array $value = []): array
    {
        return ['bet_type' => $type, 'bet_value' => $value, 'amount' => $amount];
    }

    private function currentBalance(): string
    {
        return $this->wallet->refresh()->balance;
    }

    public function test_guests_cannot_spin(): void
    {
        app('auth')->forgetGuards();

        $this->postJson("/api/games/{$this->game->slug}/spin", [
            'bets' => [$this->bet('red')],
        ])->assertUnauthorized();
    }

    public function test_it_rejects_a_stake_below_the_game_minimum(): void
    {
        $this->spin([$this->bet('red', '0.50')])
            ->assertStatus(422)
            ->assertJsonValidationErrors('bets');

        $this->assertNothingWasWritten();
    }

    public function test_it_rejects_a_stake_above_the_game_maximum(): void
    {
        $this->spin([$this->bet('red', '500.01')])
            ->assertStatus(422)
            ->assertJsonValidationErrors('bets');

        $this->assertNothingWasWritten();
    }

    public function test_it_rejects_stakes_with_sub_cent_precision(): void
    {
        $this->spin([$this->bet('red', '10.999')])
            ->assertStatus(422)
            ->assertJsonValidationErrors('bets.0.amount');

        $this->assertNothingWasWritten();
    }

    public function test_it_rejects_a_spin_the_wallet_cannot_cover(): void
    {
        $bets = array_fill(0, 12, $this->bet('red', '100.00'));

        $this->spin($bets)
            ->assertStatus(422)
            ->assertJsonValidationErrors('bets');

        $this->assertNothingWasWritten();
        $this->assertSame(self::OPENING_BALANCE, $this->currentBalance());
    }

    public function test_it_rejects_a_wallet_in_a_currency_the_game_does_not_accept(): void
    {
        $eurWallet = $this->makeWallet(WalletCurrency::Eur, '1000.00');

        $this->spin([$this->bet('red', '10.00')], ['wallet_id' => $eurWallet->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('wallet_id');

        $this->assertNothingWasWritten();
        $this->assertSame('1000.00', $eurWallet->refresh()->balance);
    }

    public function test_it_rejects_a_wallet_belonging_to_another_player(): void
    {
        $intruderWallet = $this->makeWallet(
            WalletCurrency::Demo,
            '1000.00',
            User::factory()->create()
        );

        $this->spin([$this->bet('red', '10.00')], ['wallet_id' => $intruderWallet->id])
            ->assertNotFound();

        $this->assertNothingWasWritten();
        $this->assertSame('1000.00', $intruderWallet->refresh()->balance);
    }

    public function test_it_rejects_an_unknown_bet_type(): void
    {
        $this->spin([$this->bet('basket')])
            ->assertStatus(422)
            ->assertJsonValidationErrors('bets.0.bet_type');
    }

    public function test_it_rejects_a_straight_bet_on_a_number_off_the_wheel(): void
    {
        $this->spin([$this->bet('straight', '10.00', ['numbers' => [37]])])
            ->assertStatus(422)
            ->assertJsonValidationErrors('bets.0.bet_value');

        $this->assertNothingWasWritten();
    }

    public function test_it_rejects_a_dozen_bet_without_a_dozen(): void
    {
        $this->spin([$this->bet('dozen', '10.00')])
            ->assertStatus(422)
            ->assertJsonValidationErrors('bets.0.bet_value');
    }

    public function test_it_rejects_a_column_bet_outside_one_to_three(): void
    {
        $this->spin([$this->bet('column', '10.00', ['column' => 4])])
            ->assertStatus(422)
            ->assertJsonValidationErrors('bets.0.bet_value');
    }

    public function test_it_rejects_an_empty_bet_list(): void
    {
        $this->spin([])
            ->assertStatus(422)
            ->assertJsonValidationErrors('bets');
    }

    public function test_it_rejects_more_than_twenty_bets(): void
    {
        $this->spin(array_fill(0, 21, $this->bet('red')))
            ->assertStatus(422)
            ->assertJsonValidationErrors('bets');
    }

    public function test_it_does_not_serve_an_inactive_game(): void
    {
        $this->game->forceFill(['is_active' => false])->save();

        $this->spin([$this->bet('red', '10.00')])->assertNotFound();

        $this->assertNothingWasWritten();
    }

    public function test_it_does_not_serve_a_game_of_another_type(): void
    {
        $this->game->forceFill(['type' => GameType::Slots])->save();

        $this->spin([$this->bet('red', '10.00')])->assertNotFound();

        $this->assertNothingWasWritten();
    }

    public function test_spins_are_rate_limited(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->spin([$this->bet('red', '1.00')])->assertOk();
        }

        $this->spin([$this->bet('red', '1.00')])->assertStatus(429);
    }

    private function assertNothingWasWritten(): void
    {
        $this->assertDatabaseCount('game_rounds', 0);
        $this->assertDatabaseCount('bets', 0);
        $this->assertDatabaseCount('wallet_transactions', 0);
    }
}
