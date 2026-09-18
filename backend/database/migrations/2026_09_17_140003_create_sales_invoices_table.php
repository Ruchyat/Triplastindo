<?php

use App\Enums\DocumentStatus;
use App\Enums\SettlementMethod;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Invoice penjualan. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('number', 24)->unique();
            $table->date('date');
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();

            $table->enum('settlement_method', SettlementMethod::forSales());
            // Akun kas atau bank yang menerima uang. Terisi pada penjualan
            // tunai, dan pada penjualan kredit yang disertai DP.
            $table->foreignId('cash_account_id')->nullable()->constrained('accounts')->restrictOnDelete();

            $table->unsignedSmallInteger('term_days')->nullable();
            $table->date('due_date')->nullable();

            $table->decimal('subtotal', 18, 2);
            $table->decimal('tax_amount', 18, 2)->default(0);
            $table->decimal('total', 18, 2);
            // Uang yang sudah diterima. Pada invoice tunai sama dengan total;
            // pada invoice kredit berisi DP, lalu bertambah oleh penerimaan
            // pembayaran berikutnya.
            $table->decimal('paid_amount', 18, 2)->default(0);

            $table->enum('status', DocumentStatus::stored())->default(DocumentStatus::Draft->value);
            // Jurnal yang lahir dari invoice ini. Kosong selama masih draft.
            $table->foreignId('journal_entry_id')->nullable()->constrained()->nullOnDelete();

            $table->string('note')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['date', 'status']);
            $table->index(['customer_id', 'status']);
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_invoices');
    }
};
