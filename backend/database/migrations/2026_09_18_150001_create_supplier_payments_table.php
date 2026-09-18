<?php

use App\Enums\ReceiptStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bukti pembayaran kepada supplier.
 *
 * Cermin dari `payment_receipts`: nilainya dijumlahkan dari alokasinya ke tiap
 * tagihan, sehingga total bukti dan rincian pelunasannya tidak mungkin
 * berbeda. Statusnya memakai enum yang sama — uangnya sudah keluar, atau
 * pencatatannya dibatalkan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_payments', function (Blueprint $table) {
            $table->id();
            $table->string('number', 24)->unique();
            $table->date('date');
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->foreignId('cash_account_id')->constrained('accounts')->restrictOnDelete();

            $table->decimal('amount', 18, 2);
            $table->string('reference')->nullable();
            $table->string('note')->nullable();

            $table->enum('status', ReceiptStatus::values())->default(ReceiptStatus::Posted->value);
            $table->foreignId('journal_entry_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['date', 'status']);
            $table->index(['supplier_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_payments');
    }
};
