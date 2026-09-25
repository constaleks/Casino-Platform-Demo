<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\WalletTransactionController;
use App\Http\Controllers\RouletteController;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);

    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/games', [GameController::class, 'index']);
    Route::get('/wallet-transactions', [WalletTransactionController::class, 'index']);

    Route::prefix('wallets')->group(function () {
        Route::get('/', [WalletController::class, 'index']);
        Route::post('/', [WalletController::class, 'store']);
        Route::post('/{wallet}/deposit', [WalletController::class, 'deposit']);
    });

    Route::post('/games/{game:slug}/spin', [RouletteController::class, 'spin'])->middleware('throttle:30,1');
});