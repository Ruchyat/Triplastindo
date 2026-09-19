<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Aset tetap dan penyusutannya.
 *
 * Jenis aset memetakan tiga akun sekaligus — aset, akumulasi, beban — sehingga
 * pengguna cukup memilih jenisnya dan jurnal penyusutan tersusun sendiri.
 * Penyusutan dijalankan per bulan; tiap bulan menghasilkan satu baris per aset
 * dan satu jurnal per jenis aset.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 64)->unique();
            $table->unsignedSmallInteger('default_useful_life_years')->default(5);
            $table->boolean('is_depreciable')->default(true);
            $table->foreignId('asset_account_id')->constrained('accounts')->restrictOnDelete();
            $table->foreignId('accumulated_account_id')->nullable()->constrained('accounts')->restrictOnDelete();
            $table->foreignId('expense_account_id')->nullable()->constrained('accounts')->restrictOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('fixed_assets', function (Blueprint $table) {
            $table->id();
            $table->string('code', 24)->unique();
            $table->string('name');
            $table->foreignId('asset_type_id')->constrained()->restrictOnDelete();
            $table->date('acquisition_date');
            $table->date('in_use_date');
            $table->decimal('cost', 18, 2)->default(0);
            $table->decimal('residual_value', 18, 2)->default(0);
            $table->unsignedSmallInteger('useful_life_months');
            // Penyusutan yang sudah terjadi sebelum aset dicatat di aplikasi
            // (saldo awal), tidak dijurnal lagi.
            $table->decimal('opening_accumulated', 18, 2)->default(0);
            $table->enum('status', ['active', 'disposed'])->default('active');
            $table->date('disposed_at')->nullable();
            $table->foreignId('acquisition_journal_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->foreignId('disposal_journal_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('note')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('asset_depreciations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fixed_asset_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->decimal('amount', 18, 2);
            $table->foreignId('journal_entry_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->unique(['fixed_asset_id', 'year', 'month']);
            $table->index(['year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_depreciations');
        Schema::dropIfExists('fixed_assets');
        Schema::dropIfExists('asset_types');
    }
};
