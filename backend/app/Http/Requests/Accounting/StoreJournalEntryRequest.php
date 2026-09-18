<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi bentuk jurnal manual.
 *
 * Keseimbangan debit-kredit tidak diperiksa di sini melainkan di
 * JournalPoster, supaya aturannya berlaku untuk seluruh modul dan bukan hanya
 * untuk jurnal yang datang lewat halaman Jurnal Manual.
 */
class StoreJournalEntryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:255'],
            'payment_method' => ['nullable', 'string', 'max:64'],

            'lines' => ['required', 'array', 'min:2'],
            'lines.*.account_code' => ['required', 'string', Rule::exists('accounts', 'code')],
            'lines.*.debit' => ['nullable', 'numeric', 'min:0'],
            'lines.*.credit' => ['nullable', 'numeric', 'min:0'],
            'lines.*.description' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'lines' => 'baris jurnal',
            'lines.*.account_code' => 'akun',
            'lines.*.debit' => 'debit',
            'lines.*.credit' => 'kredit',
        ];
    }
}
