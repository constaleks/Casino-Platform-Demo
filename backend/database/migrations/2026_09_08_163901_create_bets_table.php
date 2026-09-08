<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\BetStatus;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('wallet_id')->constrained()->restrictOnDelete();
            $table->foreignId('game_round_id')->constrained()->restrictOnDelete();
            $table->string('bet_type');
            $table->jsonb('bet_value');
            $table->decimal('amount', 15, 2);
            $table->decimal('payout_multiplier', 8, 2)->nullable();
            $table->decimal('payout_amount', 15, 2)->default(0);
            $table->string('status')->default(BetStatus::Placed->value);
            $table->timestamps();
            $table->index(['user_id', 'wallet_id', 'game_round_id']);
        });

        // CHECK-constraints - additional guard on DB level
        DB::statement('ALTER TABLE bets ADD CONSTRAINT bets_amount_positive CHECK (amount > 0)');
        DB::statement('ALTER TABLE bets ADD CONSTRAINT bets_payout_amount_non_negative CHECK (payout_amount >= 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bets');
    }
};
