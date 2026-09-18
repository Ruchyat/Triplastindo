<?php

namespace App\Http\Requests\Sales;

use App\Enums\SettlementMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi bentuk permintaan invoice penjualan.
 *
 * Yang diperiksa di sini hanya bentuknya: kolom wajib, tipe, dan keberadaan
 * relasi. Aturan penjualan — DP tidak melebihi total, akun penerima harus akun
 * kas, kredit harus punya jatuh tempo — tinggal di SalesInvoicePoster, agar
 * berlaku juga bagi pemanggil yang bukan HTTP.
 */
class StoreSalesInvoiceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where('is_active', true)],
            'settlement_method' => ['required', Rule::in(SettlementMethod::forSales())],
            'cash_account_id' => ['nullable', 'integer', Rule::exists('accounts', 'id')->where('is_active', true)],
            'term_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'due_date' => ['nullable', 'date', 'after_or_equal:date'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'down_payment' => ['nullable', 'numeric', 'min:0'],
            'use_deposit' => ['nullable', 'boolean'],
            'note' => ['nullable', 'string', 'max:255'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', Rule::exists('products', 'id')->where('is_active', true)],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'gt:0'],
            'items.*.description' => ['nullable', 'string', 'max:255'],

            // Draft tersimpan tanpa jurnal; angkanya belum masuk laporan.
            'post' => ['nullable', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'customer_id' => 'customer',
            'cash_account_id' => 'akun kas/bank',
            'settlement_method' => 'metode pembayaran',
            'due_date' => 'tanggal jatuh tempo',
            'items' => 'baris produk',
            'items.*.product_id' => 'produk',
            'items.*.quantity' => 'kuantitas',
            'items.*.unit_price' => 'harga',
        ];
    }

    /** Apakah invoice langsung diposting, bukan disimpan sebagai draft. */
    public function shouldPost(): bool
    {
        return $this->boolean('post', true);
    }
}
