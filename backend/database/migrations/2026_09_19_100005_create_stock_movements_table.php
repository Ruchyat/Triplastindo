<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kartu stok dalam Kg.
 *
 * Baris masuk lahir dari tagihan pembelian persediaan dan hasil produksi;
 * baris keluar dari invoice penjualan dan pemakaian bahan. Pembelian dan
 * penjualan mengisinya otomatis saat diposting; produksi diinput di modul
 * Inventory.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->enum('type', ['purchase', 'sale', 'production_in', 'consumption', 'adjustment', 'opening']);
            $table->enum('direction', ['in', 'out']);
            $table->decimal('quantity', 18, 3);
            $table->decimal('unit_cost', 18, 2)->default(0);
            $table->decimal('amount', 18, 2)->default(0);
            $table->string('source_type', 32)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('source_number', 32)->nullable();
            $table->foreignId('journal_entry_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['product_id', 'date']);
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
