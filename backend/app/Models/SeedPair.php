<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/*
 * No #[Fillable]: every column here is fairness-critical and only ever written
 * by SeedPairManager via forceFill/forceCreate
 */
#[Hidden(['server_seed', 'next_server_seed'])]
class SeedPair extends Model
{
    protected function casts(): array
    {
        return [
            'nonce' => 'integer',
            'revealed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function rounds(): HasMany
    {
        return $this->hasMany(GameRound::class);
    }
}
