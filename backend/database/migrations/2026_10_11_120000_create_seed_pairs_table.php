<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        /*
         * Commit-reveal state for provably fair games. A player's active pair has
         * revealed_at = null: its server_seed stays secret, only the hash is shown.
         * Rotating the pair stamps revealed_at, which is when the seed is disclosed.
         */
        Schema::create('seed_pairs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('server_seed');
            $table->string('server_seed_hash');
            $table->string('client_seed');
            $table->unsignedBigInteger('nonce')->default(0);
            $table->timestamp('revealed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'revealed_at']);
        });

        /*
         * At most one active (unrevealed) pair per player - a partial unique index,
         * which the schema builder can't express, so raw PostgreSQL
         */
        DB::statement('CREATE UNIQUE INDEX seed_pairs_one_active_per_user ON seed_pairs (user_id) WHERE revealed_at IS NULL');

        Schema::table('game_rounds', function (Blueprint $table) {
            $table->foreignId('seed_pair_id')->nullable()->after('user_id')->constrained()->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('game_rounds', function (Blueprint $table) {
            $table->dropConstrainedForeignId('seed_pair_id');
        });

        Schema::dropIfExists('seed_pairs');
    }
};
