<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use App\Enums\GameRoundStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['game_id', 'user_id', 'client_seed'])]
#[Hidden(['server_seed'])]
class GameRound extends Model
{
    protected function casts(): array
    {
        return [
            'status' => GameRoundStatus::class,
            'server_seed_revealed' => 'boolean',
            'nonce' => 'integer',
            'result' => 'array',
            'bets_closed_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bets(): HasMany
    {
        return $this->hasMany(Bet::class);
    }
}
