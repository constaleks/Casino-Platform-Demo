<?php

namespace Tests\Feature;

use App\Enums\WalletCurrency;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepositAndRegisterTest extends TestCase
{
    use RefreshDatabase;

    private function makeWallet(User $user): Wallet
    {
        return Wallet::forceCreate(['user_id' => $user->id, 'currency' => WalletCurrency::Demo, 'balance' => '10.00']);
    }

    public function test_deposit_rejects_scientific_notation_instead_of_crashing(): void
    {
        $user = User::factory()->create();
        $wallet = $this->makeWallet($user);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/wallets/{$wallet->id}/deposit", ['amount' => '1e3'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('amount');

        $this->assertSame('10.00', $wallet->refresh()->balance);
        $this->assertDatabaseCount('wallet_transactions', 0);
    }

    public function test_deposit_rejects_sub_cent_precision(): void
    {
        $user = User::factory()->create();
        $wallet = $this->makeWallet($user);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/wallets/{$wallet->id}/deposit", ['amount' => '0.019'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('amount');
    }

    public function test_deposit_credits_the_balance_and_the_ledger_identically(): void
    {
        $user = User::factory()->create();
        $wallet = $this->makeWallet($user);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/wallets/{$wallet->id}/deposit", ['amount' => '5.25'])
            ->assertOk();

        $this->assertSame('15.25', $wallet->refresh()->balance);
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'amount' => '5.25',
            'balance_before' => '10.00',
            'balance_after' => '15.25',
        ]);
    }

    public function test_registration_is_rate_limited(): void
    {
        /*
         * Register logs the user into a session, which Sanctum only starts for
         * requests from a stateful (first-party) origin - like the real frontend.
         * CSRF is not what's under test here, so its token check is skipped.
         */
        $this->withHeader('Origin', 'http://localhost:5173')->withoutMiddleware(ValidateCsrfToken::class);

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/auth/register', [
                'name' => 'Test Player',
                'email' => "player{$i}@example.com",
                'password' => 'Secret1234',
                'password_confirmation' => 'Secret1234',
            ])->assertCreated();

            /*
             * Deliberately NOT logging out between requests: the session from the previous
             * registration is kept, which is exactly how a per-user limit would be bypassed
             */
        }

        $this->postJson('/api/auth/register', [
            'name' => 'One Too Many',
            'email' => 'player-extra@example.com',
            'password' => 'Secret1234',
            'password_confirmation' => 'Secret1234',
        ])->assertTooManyRequests();
    }
}
