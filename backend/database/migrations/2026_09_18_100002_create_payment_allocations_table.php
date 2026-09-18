<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pembagian satu penerimaan ke invoice-invoice yang dilunasinya.
 *
 * Tabel terpisah karena satu transfer sering melunasi beberapa invoice
 * sekaligus, dan satu invoice sering dilunasi beberapa kali. Tanpa tabel ini,
 * pelunasan hanya dapat dicatat satu lawan satu, dan sisa piutang per invoice
 * tidak dapat ditelusuri.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_receipt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sales_invoice_id')->constrained()->restrictOnDelete();
            $table->decimal('amount', 18, 2);
            $table->timestamps();

            $table->index('sales_invoice_id');
            // Satu bukti tidak boleh mengalokasikan ke invoice yang sama dua kali;
            // yang benar adalah menjumlahkannya menjadi satu baris.
            $table->unique(['payment_receipt_id', 'sales_invoice_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_allocations');
    }
};
