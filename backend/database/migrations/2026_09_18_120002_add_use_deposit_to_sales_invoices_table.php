<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Apakah saldo deposit customer dipakai memotong invoice ini.
 *
 * Disimpan pada invoicenya, bukan diputuskan ulang saat posting: invoice dapat
 * disimpan sebagai draft lebih dahulu, dan pilihan pencatat harus tetap sama
 * ketika dokumen itu diposting belakangan.
 *
 * Bawaannya `false`. Pemakaian deposit adalah keputusan yang diambil pencatat
 * saat membuat invoice, bukan yang disimpulkan sistem.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_invoices', function (Blueprint $table) {
            $table->boolean('use_deposit')->default(false)->after('settlement_method');
        });
    }

    public function down(): void
    {
        Schema::table('sales_invoices', function (Blueprint $table) {
            $table->dropColumn('use_deposit');
        });
    }
};
