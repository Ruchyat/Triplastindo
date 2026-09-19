<?php

namespace App\Http\Controllers\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\AccountRequest;
use App\Http\Resources\AccountCategoryResource;
use App\Http\Resources\AccountResource;
use App\Models\Account;
use App\Models\AccountCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

/**
 * Chart of Accounts.
 *
 * Akun tidak pernah dihapus — jurnal lama merujuk ke sana — melainkan
 * dinonaktifkan. Kode, kategori, dan saldo normal akun yang sudah dipakai
 * jurnal dikunci, karena mengubahnya menggeser angka laporan periode lalu.
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
            // `group=beban,hpp` — beberapa kelompok sekaligus, dipisah koma.
            ->when($request->filled('group'), fn ($query) => $query->whereHas(
                'category',
                fn ($category) => $category->whereIn('group', explode(',', $request->string('group')->toString())),
            ))
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

    public function store(AccountRequest $request): JsonResponse
    {
        $data = $request->validated();
        $category = AccountCategory::query()->findOrFail($data['account_category_id']);

        $account = Account::query()->create([
            ...$data,
            'is_cash' => $category->isCash(),
            'is_active' => $data['is_active'] ?? true,
        ]);

        return (new AccountResource($account->load('category')))->response()->setStatusCode(201);
    }

    public function update(AccountRequest $request, Account $account): AccountResource
    {
        $data = $request->validated();

        if ($account->journalLines()->exists()) {
            $locked = array_filter([
                'code' => $data['code'] !== $account->code,
                'account_category_id' => (int) $data['account_category_id'] !== $account->account_category_id,
                'normal_balance' => $data['normal_balance'] !== $account->normal_balance->value,
            ]);

            if ($locked !== []) {
                throw ValidationException::withMessages(array_map(
                    fn () => "Akun {$account->code} sudah dipakai jurnal; kode, kategori, dan saldo normalnya tidak dapat diubah.",
                    $locked,
                ));
            }
        }

        $category = AccountCategory::query()->findOrFail($data['account_category_id']);
        $account->update([...$data, 'is_cash' => $category->isCash()]);

        return new AccountResource($account->load('category'));
    }
}
