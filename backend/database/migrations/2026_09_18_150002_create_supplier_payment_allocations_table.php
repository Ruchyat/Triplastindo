<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Pembagian satu pembayaran ke tagihan-tagihan pembelian yang dilunasinya. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_payment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_bill_id')->constrained()->restrictOnDelete();
            $table->decimal('amount', 18, 2);
            $table->timestamps();

            $table->index('purchase_bill_id');
            // Nama indeks ditulis sendiri: nama bawaannya melampaui batas 64 karakter MySQL.
            $table->unique(['supplier_payment_id', 'purchase_bill_id'], 'supplier_payment_allocations_payment_bill_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_payment_allocations');
    }
};
