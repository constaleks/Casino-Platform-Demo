<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\GameType;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('type')->default(GameType::Roulette->value);
            $table->boolean('is_active')->default(true);
            $table->decimal('min_bet', 15, 2)->default(1);
            $table->decimal('max_bet', 15, 2)->default(1000);
            $table->jsonb('config')->nullable();
            $table->timestamps();
        });
        
        // CHECK-constraints - additional guard on DB level
        DB::statement('ALTER TABLE games ADD CONSTRAINT games_min_bet_positive CHECK (min_bet > 0)');
        DB::statement('ALTER TABLE games ADD CONSTRAINT games_max_bet_gte_min_bet CHECK (max_bet >= min_bet)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
