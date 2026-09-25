<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Enums\GameType;
use App\Enums\WalletCurrency;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'name', 'type', 'is_active', 'min_bet', 'max_bet', 'config'])]
class Game extends Model
{
    protected function casts(): array
    {
        return [
            'type' => GameType::class,
            'is_active' => 'boolean',
            'min_bet' => 'decimal:2',
            'max_bet' => 'decimal:2',
            'config' => 'array',
        ];
    }

    /*
     * Which wallet currencies this game can be played with, declared under
     * config.currencies. min_bet/max_bet are currency-less numbers, so without
     * this a 500 limit means "500 of whatever the player happened to pick".
     */
    public function acceptedCurrencies(): array
    {
        $configured = $this->config['currencies'] ?? null;

        if (!is_array($configured)) {
            return [WalletCurrency::Demo];
        }

        return array_values(array_filter(
            array_map(fn ($currency) => WalletCurrency::tryFrom((string) $currency), $configured)
        ));
    }

    public function acceptsCurrency(WalletCurrency $currency): bool
    {
        return in_array($currency, $this->acceptedCurrencies(), true);
    }

    public function rounds(): HasMany
    {
        return $this->hasMany(GameRound::class);
    }
}
