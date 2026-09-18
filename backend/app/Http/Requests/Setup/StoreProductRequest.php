<?php

namespace App\Http\Requests\Setup;

use App\Enums\ProductCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi produk baru.
 *
 * Kode boleh dikosongkan — dibuatkan otomatis — supaya pencatat yang sedang
 * mengisi tagihan pembelian tidak perlu memikirkan penomoran master data.
 */
class StoreProductRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('products', 'name')],
            'category' => ['required', Rule::enum(ProductCategory::class)],
            'unit' => ['required', 'string', 'max:16'],
            'code' => ['nullable', 'string', 'max:24', Rule::unique('products', 'code')],
            'revenue_account_id' => ['nullable', 'integer', Rule::exists('accounts', 'id')->where('is_active', true)],
            'inventory_account_id' => ['nullable', 'integer', Rule::exists('accounts', 'id')->where('is_active', true)],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nama produk',
            'category' => 'kategori',
            'unit' => 'satuan',
            'code' => 'kode',
            'revenue_account_id' => 'akun pendapatan',
            'inventory_account_id' => 'akun persediaan',
        ];
    }
}
