<?php

namespace Tests\Feature;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'Secret1234';

    protected function setUp(): void
    {
        parent::setUp();

        /*
         * Login starts a session, which Sanctum only does for a stateful (first-party)
         * origin. CSRF is not what's under test here, so its token check is skipped.
         */
        $this->withHeader('Origin', 'http://localhost:5173')->withoutMiddleware(ValidateCsrfToken::class);
    }

    private function makeUser(UserStatus $status = UserStatus::Active, string $email = 'player@example.com'): User
    {
        $user = User::factory()->create(['email' => $email, 'password' => self::PASSWORD]);
        $user->forceFill(['status' => $status])->save();

        return $user;
    }

    private function login(string $email, string $password = self::PASSWORD, string $ip = '10.0.0.1'): TestResponse
    {
        return $this->withServerVariables(['REMOTE_ADDR' => $ip])
            ->postJson('/api/auth/login', ['email' => $email, 'password' => $password]);
    }

    public function test_an_active_player_can_log_in(): void
    {
        $user = $this->makeUser();

        $this->login($user->email)->assertOk()->assertJsonPath('user.id', $user->id);
        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_blocked_and_suspended_players_cannot_log_in(): void
    {
        foreach ([UserStatus::Blocked, UserStatus::Suspended] as $status) {
            $user = $this->makeUser($status, "{$status->value}@example.com");

            $this->login($user->email)
                ->assertUnprocessable()
                ->assertJsonPath('errors.email.0', "This account has been {$status->value}.");
            $this->assertGuest('web');
        }
    }

    public function test_the_status_is_not_revealed_without_the_right_password(): void
    {
        $user = $this->makeUser(UserStatus::Blocked);

        $this->login($user->email, 'Wrong1234')
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'These credentials do not match our records.');
    }

    public function test_a_signed_in_player_is_locked_out_once_blocked(): void
    {
        $user = $this->makeUser();
        $this->actingAs($user, 'sanctum');
        $this->getJson('/api/wallets')->assertOk();

        $user->forceFill(['status' => UserStatus::Blocked])->save();

        $this->getJson('/api/wallets')->assertForbidden();
        $this->postJson('/api/broadcasting/auth', ['socket_id' => '1.1', 'channel_name' => "private-users.{$user->id}"])
            ->assertForbidden();
    }

    public function test_one_account_is_rate_limited_across_many_ips(): void
    {
        $user = $this->makeUser();

        for ($i = 0; $i < 10; $i++) {
            $this->login($user->email, 'Wrong1234', "10.0.1.{$i}")->assertUnprocessable();
        }

        /* Right password, fresh IP: still refused until the window passes */
        $this->login($user->email, self::PASSWORD, '10.0.2.1')->assertTooManyRequests();
    }

    public function test_one_ip_is_rate_limited_across_many_accounts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->login("nobody{$i}@example.com", 'Wrong1234')->assertUnprocessable();
        }

        $this->login('nobody-else@example.com', 'Wrong1234')->assertTooManyRequests();
    }
}
