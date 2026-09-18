<?php

namespace App\Http\Requests\CashBank;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validasi bentuk transfer kas. Aturan akunnya ada di CashTransferPoster. */
class StoreCashTransferRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'from_account_id' => ['required', 'integer', Rule::exists('accounts', 'id')->where('is_active', true)],
            'to_account_id' => ['required', 'integer', 'different:from_account_id', Rule::exists('accounts', 'id')->where('is_active', true)],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reference' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'from_account_id' => 'akun asal',
            'to_account_id' => 'akun tujuan',
            'amount' => 'nominal',
        ];
    }
}
