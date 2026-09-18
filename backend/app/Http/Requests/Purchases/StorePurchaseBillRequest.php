<?php

namespace App\Http\Requests\Purchases;

use App\Enums\PurchaseCategory;
use App\Enums\SettlementMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi bentuk permintaan tagihan pembelian.
 *
 * Aturan pembeliannya — kategori persediaan menuntut produk, akun beban wajib
 * pada kategori Lainnya, DP tidak melebihi total — tinggal di
 * PurchaseBillPoster agar berlaku juga bagi pemanggil yang bukan HTTP.
 */
class StorePurchaseBillRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'supplier_id' => ['required', 'integer', Rule::exists('suppliers', 'id')->where('is_active', true)],
            'supplier_invoice_number' => ['nullable', 'string', 'max:255'],
            'category' => ['required', Rule::in(PurchaseCategory::values())],
            'expense_account_id' => ['nullable', 'integer', Rule::exists('accounts', 'id')->where('is_active', true)],
            'settlement_method' => ['required', Rule::in(SettlementMethod::forPurchases())],
            'cash_account_id' => ['nullable', 'integer', Rule::exists('accounts', 'id')->where('is_active', true)],
            'term_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'due_date' => ['nullable', 'date', 'after_or_equal:date'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'down_payment' => ['nullable', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:255'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'integer', Rule::exists('products', 'id')->where('is_active', true)],
            'items.*.description' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit' => ['nullable', 'string', 'max:16'],
            'items.*.unit_price' => ['required', 'numeric', 'gt:0'],

            'post' => ['nullable', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'supplier_id' => 'supplier',
            'category' => 'kategori pembelian',
            'expense_account_id' => 'akun beban',
            'cash_account_id' => 'akun kas/bank',
            'settlement_method' => 'metode pembayaran',
            'due_date' => 'tanggal jatuh tempo',
            'items' => 'baris item',
            'items.*.product_id' => 'produk',
            'items.*.quantity' => 'kuantitas',
            'items.*.unit_price' => 'harga',
        ];
    }

    /** Apakah tagihan langsung diposting, bukan disimpan sebagai draft. */
    public function shouldPost(): bool
    {
        return $this->boolean('post', true);
    }
}
