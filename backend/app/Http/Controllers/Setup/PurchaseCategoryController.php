<?php

namespace App\Http\Controllers\Setup;

use App\Enums\PurchaseCategory;
use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\JsonResponse;

/**
 * Daftar kategori pembelian beserta akun yang dipakainya.
 *
 * Dikirim ke frontend agar form pembelian dapat menjelaskan ke mana sebuah
 * kategori bermuara — pencatat melihat akunnya sebelum menyimpan, bukan baru
 * mengetahuinya setelah jurnal terbentuk.
 */
class PurchaseCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $accounts = Account::query()->get(['code', 'name'])->keyBy('code');
        $label = fn (?string $code) => $code && $accounts->has($code)
            ? "{$code} · {$accounts[$code]->name}"
            : null;

        $categories = array_map(fn (PurchaseCategory $category) => [
            'value' => $category->value,
            'label' => $category->label(),
            'hint' => $category->hint(),
            'is_stock' => $category->isStock(),
            'needs_account_choice' => $category->needsAccountChoice(),
            'debit_account' => $label($category->debitAccount()),
            'payable_account' => $label($category->payableAccount()),
        ], PurchaseCategory::cases());

        return response()->json(['data' => $categories]);
    }
}
