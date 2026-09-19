<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pemegang saham dan keputusan pembagian dividen.
 *
 * Alurnya: Finance mengajukan (draft), Direksi menyetujui (approved) — saat itu
 * jurnalnya terbentuk: D Dividen · K Hutang PPh Final · K Kas/Bank.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shareholders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('shares')->default(0);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('dividend_decisions', function (Blueprint $table) {
            $table->id();
            $table->string('number', 24)->unique();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->date('decision_date');
            $table->decimal('total_amount', 18, 2);
            $table->decimal('tax_rate', 5, 4)->default(0.1);
            $table->foreignId('cash_account_id')->constrained('accounts')->restrictOnDelete();
            $table->enum('status', ['draft', 'approved', 'cancelled'])->default('draft');
            // Angka pendukung saat diajukan, disimpan agar keputusannya dapat ditelusuri.
            $table->decimal('cash_balance', 18, 2)->default(0);
            $table->decimal('minimum_cash', 18, 2)->default(0);
            $table->decimal('net_profit', 18, 2)->default(0);
            $table->foreignId('journal_entry_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('proposed_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('dividend_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dividend_decision_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shareholder_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('shares');
            $table->decimal('percentage', 8, 6);
            $table->decimal('gross', 18, 2);
            $table->decimal('tax', 18, 2);
            $table->decimal('net', 18, 2);
            $table->timestamps();

            $table->unique(['dividend_decision_id', 'shareholder_id'], 'dividend_allocations_decision_shareholder_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dividend_allocations');
        Schema::dropIfExists('dividend_decisions');
        Schema::dropIfExists('shareholders');
    }
};
