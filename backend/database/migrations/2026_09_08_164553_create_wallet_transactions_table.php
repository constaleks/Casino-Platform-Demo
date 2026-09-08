<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\WalletTransactionType;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained()->restrictOnDelete();
            $table->string('type')->default(WalletTransactionType::Bet->value);
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->nullableMorphs('source');
            $table->string('reference')->nullable()->unique();
            $table->jsonb('meta')->nullable();
            $table->timestamps();
            $table->index(['wallet_id', 'created_at']);
        });
        
        // CHECK-constraints - additional guard on DB level
        DB::statement('ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_balance_before_non_negative CHECK (balance_before >= 0)');
        DB::statement('ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_balance_after_non_negative CHECK (balance_after >= 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
