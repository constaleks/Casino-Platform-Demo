<?php

namespace App\Enums;

enum GameRoundStatus: string
{
    case Pending = 'pending';
    case AcceptingBets = 'accepting_bets';
    case Spinning = 'spinning';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::AcceptingBets => 'Accepting Bets',
            self::Spinning => 'Spinning',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
        };
    }
}