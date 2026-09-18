<?php

use App\Enums\NormalBalance;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Chart of Accounts. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            // Format `X-XXXXX`, misalnya `1-10001`. Dipakai pengguna sebagai
            // identitas akun sehari-hari, jadi wajib unik.
            $table->string('code', 16)->unique();
            $table->string('name');
            $table->foreignId('account_category_id')->constrained()->restrictOnDelete();
            $table->enum('normal_balance', NormalBalance::values());
            // Disalin dari kategori saat akun dibuat supaya penandaan jurnal
            // dan Laporan Arus Kas tidak perlu ikut memuat relasi kategori.
            $table->boolean('is_cash')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index(['account_category_id', 'code']);
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
