<?php

use App\Services\ProvablyFair;
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
         * The server seed the pair's successor will use, committed (by its hash) while
         * this pair is still active - so it is fixed before the player picks the
         * client seed it gets combined with. Cleared on rotation, once promoted.
         */
        Schema::table('seed_pairs', function (Blueprint $table) {
            $table->string('next_server_seed')->nullable()->after('server_seed_hash');
            $table->string('next_server_seed_hash')->nullable()->after('next_server_seed');
        });

        DB::table('seed_pairs')->whereNull('revealed_at')->orderBy('id')->each(function (object $pair) {
            $nextServerSeed = ProvablyFair::generateServerSeed();

            DB::table('seed_pairs')->where('id', $pair->id)->update([
                'next_server_seed' => $nextServerSeed,
                'next_server_seed_hash' => ProvablyFair::hashServerSeed($nextServerSeed),
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seed_pairs', function (Blueprint $table) {
            $table->dropColumn(['next_server_seed', 'next_server_seed_hash']);
        });
    }
};
