<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Nomor dokumen asal sebuah jurnal, misalnya `INV/2026/09/0001`.
 *
 * Sengaja disalin ke tabel jurnal, bukan diambil lewat relasi ke tabel
 * dokumennya. Alasannya dua: nomor dokumen tidak pernah berubah setelah
 * dibuat, sehingga salinannya tidak akan basi; dan Jurnal Umum menampilkannya
 * di setiap baris, sehingga mengambilnya lewat relasi berarti satu kueri
 * tambahan per jenis dokumen pada setiap halaman.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->string('source_number', 24)->nullable()->after('source_id');
            $table->index('source_number');
        });
    }

    public function down(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropIndex(['source_number']);
            $table->dropColumn('source_number');
        });
    }
};
