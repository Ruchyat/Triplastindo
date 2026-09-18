<?php

use App\Enums\JournalSource;
use App\Enums\JournalTagging;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kepala jurnal — satu baris per transaksi.
 *
 * Inilah pusat data aplikasi. Modul penjualan, pembelian, pengeluaran, kas,
 * payroll, dan penyusutan semuanya bermuara ke sini; laporan keuangan dan
 * Buku Besar semuanya dibaca dari sini.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            // Nomor bukti `JU/2026/09/0001`, berurut per bulan.
            $table->string('number', 24)->unique();
            $table->date('date');
            $table->string('description');
            $table->enum('tagging', JournalTagging::values());

            // Asal jurnal. `source_id` menunjuk ke baris dokumen asalnya pada
            // tabel modul terkait; kosong untuk jurnal manual. Sengaja tidak
            // memakai relasi polimorfik Eloquent supaya isi kolomnya tetap
            // terbaca sebagai data, bukan sebagai nama kelas PHP.
            $table->enum('source', JournalSource::values())->default(JournalSource::Manual->value);
            $table->unsignedBigInteger('source_id')->nullable();

            $table->string('payment_method')->nullable();
            $table->string('attachment_path')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            // Jurnal tidak pernah dihapus permanen: yang terhapus tetap perlu
            // dapat ditelusuri saat audit.
            $table->softDeletes();

            $table->index('date');
            $table->index(['source', 'source_id']);
            $table->index(['date', 'tagging']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_entries');
    }
};
