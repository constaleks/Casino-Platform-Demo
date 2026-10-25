<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Enums\UserStatus;
use App\Enums\WalletCurrency;
use App\Models\WalletTransaction;
use App\Enums\WalletTransactionType;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected const WELCOME_BONUS = 1000.00;

    public function register(RegisterRequest $request)
    {
        [$user, $wallet] = DB::transaction(function() use ($request) {
            $user = User::create($request->validated());

            $wallet = $user->wallets()->create([
                'currency' => WalletCurrency::Demo,
            ]);

            $wallet->forceFill(['balance' => self::WELCOME_BONUS])->save();

            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => WalletTransactionType::Bonus,
                'amount' => self::WELCOME_BONUS,
                'balance_before' => 0,
                'balance_after' => self::WELCOME_BONUS,
                'reference' => "welcome_bonus_user_{$user->id}",
            ]);

            return [$user, $wallet];
        });

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => $user->load('wallets'),
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        /*
         * attemptWhen only runs the callback once the password has been verified, so
         * an account's status is never revealed to someone who doesn't know it
         */
        $inactiveStatus = null;

        $loggedIn = Auth::guard('web')->attemptWhen(
            $request->only('email', 'password'),
            function (User $user) use (&$inactiveStatus) {
                $inactiveStatus = $user->status === UserStatus::Active ? null : $user->status;

                return $inactiveStatus === null;
            },
            $request->boolean('remember'),
        );

        if (!$loggedIn) {
            throw ValidationException::withMessages([
                'email' => $inactiveStatus
                    ? "This account has been {$inactiveStatus->value}."
                    : 'These credentials do not match our records.',
            ]);
        }
 
        $request->session()->regenerate();
 
        $user = Auth::guard('web')->user();
        $user->forceFill(['last_login_at' => now()])->save();
 
        return response()->json([
            'user' => $user->load('wallets'),
        ]);
    }
 
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
 
        $request->session()->invalidate();
        $request->session()->regenerateToken();
 
        return response()->noContent();
    }
 
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('wallets'),
        ]);
    }
}
