<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\WalletTransactionController;
use App\Http\Controllers\RouletteController;
use App\Http\Controllers\FairnessController;

Route::prefix('auth')->group(function () {
    /*
     * Every new account gets a welcome bonus, so registration is limited per IP
     * to keep scripts from mass-creating accounts (limiter: AppServiceProvider)
     */
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');

    /* Limited per IP and per email (limiter: AppServiceProvider) */
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('/games', [GameController::class, 'index']);
    Route::get('/wallet-transactions', [WalletTransactionController::class, 'index']);

    Route::prefix('wallets')->group(function () {
        Route::get('/', [WalletController::class, 'index']);
        Route::post('/', [WalletController::class, 'store']);
        Route::post('/{wallet}/deposit', [WalletController::class, 'deposit']);
    });

    Route::post('/games/{game:slug}/spin', [RouletteController::class, 'spin'])->middleware('throttle:30,1');

    Route::prefix('fairness')->group(function () {
        Route::get('/', [FairnessController::class, 'show']);
        Route::post('/rotate', [FairnessController::class, 'rotate'])->middleware('throttle:10,1');
    });
});