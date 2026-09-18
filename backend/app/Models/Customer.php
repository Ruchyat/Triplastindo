<?php

namespace App\Models;

use App\Enums\DepositMovement;
use App\Enums\DocumentStatus;
use App\Enums\ReceiptStatus;
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
    'code', 'name', 'contact_name', 'phone', 'email', 'address',
    'npwp', 'payment_term_days', 'credit_limit', 'is_active',
])]
class Customer extends Model
{
    protected function casts(): array
    {
        return [
            'payment_term_days' => 'integer',
            'credit_limit' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<CustomerDeposit, $this> */
    public function deposits(): HasMany
    {
        return $this->hasMany(CustomerDeposit::class);
    }

    /** @return HasMany<SalesInvoice, $this> */
    public function salesInvoices(): HasMany
    {
        return $this->hasMany(SalesInvoice::class);
    }

    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * Menyertakan saldo piutang dan deposit sebagai kolom hasil hitung.
     *
     * Dihitung lewat subquery, bukan lewat satu kueri per customer. Daftar
     * customer ditampilkan utuh tanpa paginasi, sehingga cara kedua berarti
     * ratusan kueri sekali muat begitu master datanya bertambah besar.
     */
    #[Scope]
    protected function withBalances(Builder $query): void
    {
        $query
            ->addSelect(['customers.*'])
            ->selectSub(
                SalesInvoice::query()
                    ->selectRaw('COALESCE(SUM(total - paid_amount), 0)')
                    ->whereColumn('sales_invoices.customer_id', 'customers.id')
                    ->whereNull('sales_invoices.deleted_at')
                    ->whereIn('sales_invoices.status', [
                        DocumentStatus::Unpaid->value,
                        DocumentStatus::Partial->value,
                    ]),
                'open_receivable_sum',
            )
            ->selectSub(
                CustomerDeposit::query()
                    ->selectRaw(sprintf(
                        "COALESCE(SUM(CASE WHEN movement = '%s' THEN amount ELSE -amount END), 0)",
                        DepositMovement::Received->value,
                    ))
                    ->whereColumn('customer_deposits.customer_id', 'customers.id')
                    ->whereNull('customer_deposits.deleted_at')
                    ->where('customer_deposits.status', ReceiptStatus::Posted->value),
                'deposit_balance_sum',
            );
    }

    /**
     * Total nilai invoice yang belum lunas.
     *
     * Dihitung dari invoice, bukan dari saldo yang disimpan, supaya angkanya
     * tidak pernah berbeda dengan dokumen yang mendasarinya.
     */
    /** Saldo deposit yang masih dapat dipakai, dihitung dari kartu depositnya. */
    public function depositBalance(): string
    {
        if ($this->deposit_balance_sum !== null) {
            return bcadd((string) $this->deposit_balance_sum, '0', 2);
        }

        return CustomerDeposit::balanceOf($this->id);
    }

    public function openReceivable(): string
    {
        // Dipakai kolom hasil `withBalances()` bila tersedia, agar daftar
        // customer tidak menjalankan satu kueri agregasi per baris.
        if ($this->open_receivable_sum !== null) {
            return bcadd((string) $this->open_receivable_sum, '0', 2);
        }

        return (string) $this->salesInvoices()
            ->outstanding()
            ->selectRaw('COALESCE(SUM(total - paid_amount), 0) as balance')
            ->value('balance');
    }
}
