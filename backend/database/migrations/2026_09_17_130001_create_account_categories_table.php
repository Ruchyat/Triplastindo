<?php

use App\Enums\AccountGroup;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kategori akun — satu tingkat di atas Chart of Accounts.
 *
 * Laporan keuangan disusun per kategori, bukan per akun, sehingga kategori
 * disimpan sebagai tabel tersendiri dan bukan sebagai kolom teks pada akun.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->enum('group', AccountGroup::values());
            // Urutan tampil pada laporan dan dropdown. Kategori tidak pernah
            // diurutkan secara alfabet karena Neraca punya urutan bakunya.
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('group');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_categories');
    }
};
