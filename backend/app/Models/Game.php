<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Enums\GameType;
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

    public function rounds(): HasMany
    {
        return $this->hasMany(GameRound::class);
    }
}
