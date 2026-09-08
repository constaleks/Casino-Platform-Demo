<?php

namespace App\Enums;

enum WalletCurrency: string
{
    case Usd = 'USD';
    case Eur = 'EUR';
    case Demo = 'DEMO';

    public function label(): string
    {
        return match ($this) {
            self::Usd => 'US Dollar',
            self::Eur => 'Euro',
            self::Demo => 'Demo Balance',
        };
    }
}