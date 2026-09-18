<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Baris item tagihan pembelian.
 *
 * `product_id` terisi pada kategori persediaan, sehingga kartu stok kelak
 * dapat mengikuti. Pada kategori beban — jasa, pelumas, perlengkapan — tidak
 * ada produk yang dirujuk, dan keterangannya yang menjelaskan isi barisnya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_bill_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_bill_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->restrictOnDelete();

            $table->string('description')->nullable();
            $table->decimal('quantity', 18, 3);
            $table->string('unit', 16)->default('Kg');
            $table->decimal('unit_price', 18, 2);
            $table->decimal('amount', 18, 2);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['purchase_bill_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_bill_items');
    }
};
