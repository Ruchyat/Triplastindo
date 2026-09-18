<?php

namespace App\Models;

use App\Enums\DepositMovement;
use App\Enums\ReceiptStatus;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Satu mutasi pada kartu deposit pelanggan.
 *
 * @property string $number
 * @property Carbon $date
 * @property DepositMovement $movement
 * @property string $amount
 * @property ReceiptStatus $status
 */
class CustomerDeposit extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'movement' => DepositMovement::class,
            'amount' => 'decimal:2',
            'status' => ReceiptStatus::class,
        ];
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @return BelongsTo<Account, $this> */
    public function cashAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'cash_account_id');
    }

    /** @return BelongsTo<SalesInvoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class, 'sales_invoice_id');
    }

    /** @return BelongsTo<JournalEntry, $this> */
    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    #[Scope]
    protected function posted(Builder $query): void
    {
        $query->where('status', ReceiptStatus::Posted);
    }

    #[Scope]
    protected function between(Builder $query, string $from, string $to): void
    {
        $query->whereBetween('date', [$from, $to]);
    }

    public function isCancelled(): bool
    {
        return $this->status === ReceiptStatus::Cancelled;
    }

    /**
     * Saldo deposit seorang customer, dihitung dari mutasinya.
     *
     * Deposit masuk menambah; pemakaian pada invoice dan pengembalian
     * mengurangi. Mutasi yang dibatalkan tidak ikut dihitung.
     */
    public static function balanceOf(int $customerId): string
    {
        $sums = static::query()
            ->posted()
            ->where('customer_id', $customerId)
            ->selectRaw('movement, SUM(amount) as total')
            ->groupBy('movement')
            ->pluck('total', 'movement');

        $balance = '0.00';

        foreach ($sums as $movement => $total) {
            $balance = DepositMovement::from($movement)->isIncoming()
                ? bcadd($balance, (string) $total, 2)
                : bcsub($balance, (string) $total, 2);
        }

        return $balance;
    }
}
