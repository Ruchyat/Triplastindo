<?php

namespace App\Models;

use App\Enums\DocumentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $code
 * @property string $name
 * @property int $payment_term_days
 * @property bool $is_active
 */
#[Fillable([
    'code', 'name', 'contact_name', 'phone', 'email',
    'address', 'npwp', 'payment_term_days', 'is_active',
])]
class Supplier extends Model
{
    protected function casts(): array
    {
        return [
            'payment_term_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<PurchaseBill, $this> */
    public function purchaseBills(): HasMany
    {
        return $this->hasMany(PurchaseBill::class);
    }

    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /** Total pembelian dan pembayaran dalam satu tahun, untuk halaman Supplier. */
    #[Scope]
    protected function withActivity(Builder $query, int $year): void
    {
        $bills = fn () => PurchaseBill::query()
            ->whereColumn('purchase_bills.supplier_id', 'suppliers.id')
            ->whereNull('purchase_bills.deleted_at')
            ->whereNotIn('purchase_bills.status', [DocumentStatus::Draft->value, DocumentStatus::Cancelled->value])
            ->whereYear('purchase_bills.date', $year);

        $query
            ->addSelect(['suppliers.*'])
            ->selectSub($bills()->selectRaw('COALESCE(SUM(total), 0)'), 'total_purchases_sum')
            ->selectSub($bills()->selectRaw('COALESCE(SUM(paid_amount), 0)'), 'paid_sum');
    }

    /**
     * Total nilai tagihan yang belum lunas.
     *
     * Dihitung dari tagihannya, bukan dari saldo yang disimpan, supaya
     * angkanya tidak pernah berbeda dengan dokumen yang mendasarinya.
     */
    public function openPayable(): string
    {
        return bcadd((string) $this->purchaseBills()
            ->outstanding()
            ->selectRaw('COALESCE(SUM(total - paid_amount), 0) as balance')
            ->value('balance'), '0', 2);
    }
}
