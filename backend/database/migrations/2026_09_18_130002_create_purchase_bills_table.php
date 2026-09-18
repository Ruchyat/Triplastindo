<?php

use App\Enums\DocumentStatus;
use App\Enums\PurchaseCategory;
use App\Enums\SettlementMethod;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tagihan pembelian.
 *
 * Cerminan invoice penjualan, dengan satu perbedaan penting: kategorinya.
 * Penjualan selalu bermuara ke akun pendapatan, sedangkan pembelian bisa
 * masuk persediaan, aset, atau langsung menjadi beban — kategorilah yang
 * menentukannya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_bills', function (Blueprint $table) {
            $table->id();
            $table->string('number', 24)->unique();
            $table->date('date');
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();

            // Nomor nota dari supplier, dipakai mencocokkan dokumen fisiknya.
            $table->string('supplier_invoice_number')->nullable();

            $table->enum('category', PurchaseCategory::values());
            // Terisi hanya pada kategori Lainnya, yang akunnya dipilih sendiri.
            $table->foreignId('expense_account_id')->nullable()->constrained('accounts')->restrictOnDelete();

            $table->enum('settlement_method', SettlementMethod::forPurchases());
            $table->foreignId('cash_account_id')->nullable()->constrained('accounts')->restrictOnDelete();

            $table->unsignedSmallInteger('term_days')->nullable();
            $table->date('due_date')->nullable();

            $table->decimal('subtotal', 18, 2);
            $table->decimal('tax_amount', 18, 2)->default(0);
            $table->decimal('total', 18, 2);
            $table->decimal('paid_amount', 18, 2)->default(0);

            $table->enum('status', DocumentStatus::stored())->default(DocumentStatus::Draft->value);
            $table->foreignId('journal_entry_id')->nullable()->constrained()->nullOnDelete();

            $table->string('note')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['date', 'status']);
            $table->index(['supplier_id', 'status']);
            $table->index(['category', 'date']);
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_bills');
    }
};
