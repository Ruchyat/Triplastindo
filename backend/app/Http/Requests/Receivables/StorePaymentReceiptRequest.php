<?php

namespace App\Http\Requests\Receivables;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi bentuk permintaan penerimaan pembayaran.
 *
 * Aturan pelunasan — invoice milik customer yang sama, nilai tidak melebihi
 * sisa piutang, akun penerima harus akun kas — tinggal di PaymentReceiptPoster
 * agar berlaku juga bagi pemanggil yang bukan HTTP.
 */
class StorePaymentReceiptRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')],
            'cash_account_id' => ['required', 'integer', Rule::exists('accounts', 'id')->where('is_active', true)],
            'reference' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:255'],

            'allocations' => ['required', 'array', 'min:1'],
            'allocations.*.sales_invoice_id' => ['required', 'integer', 'distinct', Rule::exists('sales_invoices', 'id')],
            'allocations.*.amount' => ['required', 'numeric', 'gt:0'],
        ];
    }

    public function attributes(): array
    {
        return [
            'customer_id' => 'customer',
            'cash_account_id' => 'akun kas/bank',
            'allocations' => 'invoice yang dilunasi',
            'allocations.*.sales_invoice_id' => 'invoice',
            'allocations.*.amount' => 'nilai pelunasan',
        ];
    }
}
