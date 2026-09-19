<?php

namespace App\Http\Requests\Setup;

use App\Enums\NormalBalance;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validasi akun COA, untuk pembuatan maupun penyuntingan. */
class AccountRequest extends FormRequest
{
    public function rules(): array
    {
        $current = $this->route('account');

        return [
            'code' => ['required', 'string', 'max:16', 'regex:/^[0-9]-[0-9]{5}$/', Rule::unique('accounts', 'code')->ignore($current)],
            'name' => ['required', 'string', 'max:255'],
            'account_category_id' => ['required', 'integer', Rule::exists('account_categories', 'id')],
            'normal_balance' => ['required', Rule::enum(NormalBalance::class)],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'Kode akun berpola `1-10003`: satu digit kelompok, tanda hubung, lima digit.',
        ];
    }

    public function attributes(): array
    {
        return [
            'code' => 'kode akun',
            'name' => 'nama akun',
            'account_category_id' => 'kategori',
            'normal_balance' => 'saldo normal',
        ];
    }
}
