<?php

use App\Enums\PeriodStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bulan buku beserta statusnya.
 *
 * Barisnya dibuat saat sebuah bulan ditutup. Bulan yang belum punya baris
 * dianggap terbuka — dengan begitu aplikasi tidak perlu menyemai seluruh
 * bulan di muka hanya untuk bisa menerima jurnal.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fiscal_periods', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->enum('status', array_column(PeriodStatus::cases(), 'value'))
                ->default(PeriodStatus::Open->value);
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->unique(['year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fiscal_periods');
    }
};
