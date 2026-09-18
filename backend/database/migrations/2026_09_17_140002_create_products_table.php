<?php

use App\Enums\ProductCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Master produk dan item.
 *
 * Pemetaan ke akun akuntansi ada di sini: inilah yang membuat pengguna cukup
 * memilih "Tali" pada invoice, sementara sistem tahu pendapatannya masuk ke
 * akun 4-10000. Tanpa pemetaan ini, pengguna akan kembali harus memilih akun
 * sendiri — persis yang ingin dihindari pendekatan transaction-first.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('code', 24)->unique();
            $table->string('name');
            $table->enum('category', ProductCategory::values());
            $table->string('unit', 16)->default('Kg');

            // Akun pendapatan dipakai saat produk dijual, akun persediaan saat
            // dibeli. Keduanya opsional: item jasa tidak punya persediaan, dan
            // bahan baku tidak pernah dijual.
            $table->foreignId('revenue_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignId('inventory_account_id')->nullable()->constrained('accounts')->nullOnDelete();

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['category', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
