<?php

namespace App\Enums;

enum GameType: string
{
    case Roulette = 'roulette';
    case Blackjack = 'blackjack';
    case Slots = 'slots';

    public function label(): string
    {
        return match ($this) {
            self::Roulette => 'Roulette',
            self::Blackjack => 'Blackjack',
            self::Slots => 'Slots',
        };
    }
}