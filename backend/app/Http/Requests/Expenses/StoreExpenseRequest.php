<?php

namespace App\Http\Requests\Expenses;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validasi bentuk bukti pengeluaran. Aturan akunnya ada di ExpensePoster. */
class StoreExpenseRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'expense_account_id' => ['required', 'integer', Rule::exists('accounts', 'id')->where('is_active', true)],
            'cash_account_id' => ['required', 'integer', Rule::exists('accounts', 'id')->where('is_active', true)],
            'payee' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reference' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'expense_account_id' => 'akun beban',
            'cash_account_id' => 'akun kas/bank',
            'payee' => 'penerima',
            'description' => 'keterangan',
            'amount' => 'nominal',
        ];
    }
}
