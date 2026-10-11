<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Password::defaults(function () {
            return Password::min(8)->mixedCase()->numbers();
        });

        Relation::enforceMorphMap([
            'bet' => \App\Models\Bet::class,
        ]);

        /*
         * Keyed by IP only. The plain throttle:x,y middleware keys by user id once
         * someone is logged in - and registering logs you in - so a client that
         * keeps its session cookie would get a fresh limit for every new account.
         */
        RateLimiter::for('register', function (Request $request) {
            return Limit::perHour(10)->by('register:'.$request->ip());
        });
    }
}
