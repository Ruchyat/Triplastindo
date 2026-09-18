<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Master customer, sumber invoice penjualan dan piutang. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 24)->unique();
            $table->string('name');
            $table->string('contact_name')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('npwp', 32)->nullable();
            // Termin bawaan saat membuat invoice kredit; masih dapat diubah
            // per invoice karena kesepakatan kadang berbeda.
            $table->unsignedSmallInteger('payment_term_days')->default(30);
            $table->decimal('credit_limit', 18, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('name');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
