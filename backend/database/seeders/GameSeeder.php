<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Enums\GameType;
use App\Models\Game;

class GameSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Game::firstOrCreate(
            ['slug' => 'european-roulette'],
            [
                'name' => 'European Roulette',
                'type' => GameType::Roulette,
                'is_active' => true,
                'min_bet' => 1,
                'max_bet' => 500,
            ]
        );
    }
}
