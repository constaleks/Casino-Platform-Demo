<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Enums\GameType;
use App\Enums\WalletCurrency;
use App\Models\Game;

class GameSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
         * updateOrCreate rather than firstOrCreate so re-seeding an existing database
         * picks up config changes. Game::acceptedCurrencies() fails closed, so a game
         * that never gets this config is playable with the demo wallet only.
         */
        Game::updateOrCreate(
            ['slug' => 'european-roulette'],
            [
                'name' => 'European Roulette',
                'type' => GameType::Roulette,
                'is_active' => true,
                'min_bet' => 1,
                'max_bet' => 500,
                'config' => [
                    'currencies' => [
                        WalletCurrency::Demo->value,
                        WalletCurrency::Usd->value,
                        WalletCurrency::Eur->value,
                    ],
                ],
            ]
        );
    }
}
