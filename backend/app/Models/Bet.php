<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use App\Enums\BetStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'wallet_id', 'game_round_id', 'bet_type', 'bet_value', 'amount'])]
class Bet extends Model
{
    protected function casts(): array
    {
        return [
            'bet_value' => 'array',
            'amount' => 'decimal:2',
            'payout_multiplier' => 'decimal:2',
            'payout_amount' => 'decimal:2',
            'status' => BetStatus::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
 
    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }
 
    public function round(): BelongsTo
    {
        return $this->belongsTo(GameRound::class, 'game_round_id');
    }
}
