<?php

namespace App\Http\Requests\Deposits;

use App\Enums\DepositMovement;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi bentuk mutasi deposit yang dibuat pengguna.
 *
 * Hanya deposit masuk dan pengembalian; pemakaian pada invoice lahir sendiri
 * saat invoicenya diposting dan tidak dapat diminta lewat endpoint ini.
 */
class StoreCustomerDepositRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')],
            'movement' => ['required', Rule::in(DepositMovement::userCreatable())],
            'amount' => ['required', 'numeric', 'gt:0'],
            'cash_account_id' => ['required', 'integer', Rule::exists('accounts', 'id')->where('is_active', true)],
            'reference' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'customer_id' => 'customer',
            'cash_account_id' => 'akun kas/bank',
            'movement' => 'jenis mutasi',
            'amount' => 'nilai deposit',
        ];
    }
}
