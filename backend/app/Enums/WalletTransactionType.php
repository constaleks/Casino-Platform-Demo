<?php

namespace App\Enums;

enum WalletTransactionType: string
{
    case Deposit = 'deposit';
    case Withdrawal = 'withdrawal';
    case Bet = 'bet';
    case Win = 'win';
    case Refund = 'refund';
    case Bonus = 'bonus';

    public function label(): string
    {
        return match ($this) {
            self::Deposit => 'Deposit',
            self::Withdrawal => 'Withdrawal',
            self::Bet => 'Bet',
            self::Win => 'Win',
            self::Refund => 'Refund',
            self::Bonus => 'Bonus',
        };
    }
}