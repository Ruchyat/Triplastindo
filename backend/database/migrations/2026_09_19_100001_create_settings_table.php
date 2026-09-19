<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pengaturan aplikasi: profil perusahaan dan parameter perhitungan.
 *
 * Disimpan sebagai pasangan kunci–nilai JSON supaya parameter baru tidak
 * menuntut migrasi. Daftar kunci dan nilai bawaannya ada di `config/triplastindo.php`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key', 64)->primary();
            $table->json('value');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
