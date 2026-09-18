<?php

namespace App\Http\Controllers\Setup;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccountCategoryResource;
use App\Http\Resources\AccountResource;
use App\Models\Account;
use App\Models\AccountCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Chart of Accounts, hanya baca untuk saat ini.
 *
 * Perubahan COA menyusul bersama modul Setup. Yang dibutuhkan sekarang adalah
 * daftarnya, untuk mengisi dropdown akun pada form transaksi dan jurnal.
 */
class AccountController extends Controller
{
    /**
     * Daftar akun.
     *
     * Tidak dipaginasi: COA hanya berisi ratusan baris, jarang berubah, dan
     * frontend memakainya sekaligus sebagai isi dropdown. Memaginasinya justru
     * memaksa frontend mengambil seluruh halaman satu per satu.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $accounts = Account::query()
            ->with('category')
            ->when($request->filled('category_id'), fn ($query) => $query->where('account_category_id', $request->integer('category_id')))
            ->when($request->has('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->when($request->boolean('is_cash'), fn ($query) => $query->where('is_cash', true))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(fn ($q) => $q->where('code', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%"));
            })
            ->orderBy('code')
            ->get();

        return AccountResource::collection($accounts);
    }

    /** Daftar kategori akun beserta kelompok dan laporannya. */
    public function categories(): AnonymousResourceCollection
    {
        return AccountCategoryResource::collection(
            AccountCategory::query()->orderBy('sort_order')->get()
        );
    }
}
