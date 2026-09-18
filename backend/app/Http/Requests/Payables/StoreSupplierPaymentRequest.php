<?php

namespace App\Http\Requests\Payables;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi bentuk permintaan pembayaran supplier.
 *
 * Aturan pelunasan — tagihan milik supplier yang sama, nilai tidak melebihi
 * sisa utang, akun pembayar harus akun kas — tinggal di SupplierPaymentPoster.
 */
class StoreSupplierPaymentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'supplier_id' => ['required', 'integer', Rule::exists('suppliers', 'id')],
            'cash_account_id' => ['required', 'integer', Rule::exists('accounts', 'id')->where('is_active', true)],
            'reference' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:255'],

            'allocations' => ['required', 'array', 'min:1'],
            'allocations.*.purchase_bill_id' => ['required', 'integer', 'distinct', Rule::exists('purchase_bills', 'id')],
            'allocations.*.amount' => ['required', 'numeric', 'gt:0'],
        ];
    }

    public function attributes(): array
    {
        return [
            'supplier_id' => 'supplier',
            'cash_account_id' => 'akun kas/bank',
            'allocations' => 'tagihan yang dibayar',
            'allocations.*.purchase_bill_id' => 'tagihan',
            'allocations.*.amount' => 'nilai pembayaran',
        ];
    }
}
