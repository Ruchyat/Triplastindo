<?php

use App\Enums\DepositMovement;
use App\Enums\ReceiptStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kartu deposit pelanggan — satu baris per mutasi.
 *
 * Saldo deposit tidak disimpan sebagai satu angka per customer, melainkan
 * dihitung dari mutasinya. Saldo yang disimpan akan mudah berbeda dari
 * riwayatnya begitu ada satu pembatalan yang gagal ikut memperbaruinya, dan
 * selisihnya tidak akan terlihat sampai ada yang mencocokkan keduanya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_deposits', function (Blueprint $table) {
            $table->id();
            $table->string('number', 24)->unique();
            $table->date('date');
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->enum('movement', DepositMovement::values());

            // Selalu positif. Arahnya ditentukan oleh `movement`, bukan tanda.
            $table->decimal('amount', 18, 2);

            // Terisi pada deposit masuk dan pengembalian; kosong pada pemakaian.
            $table->foreignId('cash_account_id')->nullable()->constrained('accounts')->restrictOnDelete();
            // Terisi pada pemakaian; menunjuk invoice yang memotong deposit ini.
            $table->foreignId('sales_invoice_id')->nullable()->constrained()->cascadeOnDelete();

            $table->string('reference')->nullable();
            $table->string('note')->nullable();

            $table->enum('status', ReceiptStatus::values())->default(ReceiptStatus::Posted->value);
            $table->foreignId('journal_entry_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['customer_id', 'status']);
            $table->index(['date', 'movement']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_deposits');
    }
};
