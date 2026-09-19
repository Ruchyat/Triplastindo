<?php

namespace App\Http\Requests\Setup;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validasi customer, untuk pembuatan maupun penyuntingan. */
class CustomerRequest extends FormRequest
{
    public function rules(): array
    {
        $current = $this->route('customer');

        return [
            'code' => ['nullable', 'string', 'max:24', Rule::unique('customers', 'code')->ignore($current)],
            'name' => ['required', 'string', 'max:255', Rule::unique('customers', 'name')->ignore($current)],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:64'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'npwp' => ['nullable', 'string', 'max:32'],
            'payment_term_days' => ['required', 'integer', 'min:0', 'max:365'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'code' => 'kode',
            'name' => 'nama customer',
            'contact_name' => 'nama kontak',
            'phone' => 'telepon',
            'payment_term_days' => 'termin',
            'credit_limit' => 'batas kredit',
        ];
    }
}
