<?php

use App\Enums\ReceiptStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bukti pengeluaran biaya yang dibayar langsung.
 *
 * Untuk biaya yang tidak melalui proses pembelian barang: listrik,
 * transportasi, konsumsi, admin bank. Akun bebannya dipilih pengguna dari
 * kelompok Beban dan HPP; uangnya keluar dari satu akun kas/bank.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('number', 24)->unique();
            $table->date('date');
            $table->foreignId('expense_account_id')->constrained('accounts')->restrictOnDelete();
            $table->foreignId('cash_account_id')->constrained('accounts')->restrictOnDelete();

            $table->string('payee')->nullable();
            $table->string('description');
            $table->decimal('amount', 18, 2);
            $table->string('reference')->nullable();
            $table->string('note')->nullable();

            $table->enum('status', ReceiptStatus::values())->default(ReceiptStatus::Posted->value);
            $table->foreignId('journal_entry_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['date', 'status']);
            $table->index(['expense_account_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
