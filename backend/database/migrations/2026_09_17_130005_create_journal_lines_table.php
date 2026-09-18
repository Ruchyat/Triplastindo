<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Baris jurnal — sisi debit dan kredit sebuah transaksi.
 *
 * Satu baris hanya mengisi salah satu sisi; sisi lainnya bernilai nol. Jumlah
 * debit dan kredit dalam satu jurnal wajib sama, dijaga oleh JournalPoster.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained()->restrictOnDelete();

            // decimal(18,2): cukup untuk nilai rupiah sampai ratusan triliun,
            // dan bukan float supaya penjumlahan debit-kredit tidak pernah
            // meleset karena pembulatan biner.
            $table->decimal('debit', 18, 2)->default(0);
            $table->decimal('credit', 18, 2)->default(0);

            $table->string('description')->nullable();
            // Tanggal jurnal disalin ke sini agar Buku Besar dan neraca saldo
            // dapat dihitung tanpa join ke tabel kepala.
            $table->date('date');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['account_id', 'date']);
            $table->index(['journal_entry_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_lines');
    }
};
