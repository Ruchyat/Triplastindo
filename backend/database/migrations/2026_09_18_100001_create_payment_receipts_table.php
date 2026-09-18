<?php

use App\Enums\ReceiptStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bukti penerimaan pembayaran dari customer.
 *
 * Nilai penerimaan tidak disimpan sebagai angka yang diketik pengguna,
 * melainkan dijumlahkan dari alokasinya ke tiap invoice. Dengan begitu total
 * bukti dan rincian pelunasannya tidak mungkin berbeda.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('number', 24)->unique();
            $table->date('date');
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('cash_account_id')->constrained('accounts')->restrictOnDelete();

            $table->decimal('amount', 18, 2);
            // Nomor rujukan dari pihak luar: bukti transfer, nomor cek, giro.
            $table->string('reference')->nullable();
            $table->string('note')->nullable();

            $table->enum('status', ReceiptStatus::values())->default(ReceiptStatus::Posted->value);
            $table->foreignId('journal_entry_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['date', 'status']);
            $table->index(['customer_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_receipts');
    }
};
