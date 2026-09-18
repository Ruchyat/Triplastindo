<?php

namespace App\Services\Sales;

use App\Enums\SettlementMethod;
use Illuminate\Support\Carbon;

/**
 * Isi sebuah invoice penjualan yang diajukan ke SalesInvoicePoster.
 *
 * Nilai uang berupa string dua desimal, sama seperti pada jurnal, agar tidak
 * ada titik dalam perjalanan data yang mengubahnya menjadi float.
 */
final readonly class SalesInvoiceData
{
    /** @param  list<SalesInvoiceItemData>  $items */
    public function __construct(
        public Carbon $date,
        public int $customerId,
        public SettlementMethod $settlementMethod,
        public array $items,
        public ?int $cashAccountId = null,
        public ?int $termDays = null,
        public ?Carbon $dueDate = null,
        public string $taxAmount = '0.00',
        /** DP yang diterima saat invoice kredit dibuat. */
        public string $downPayment = '0.00',
        /**
         * Memakai saldo deposit customer untuk memotong invoice ini.
         *
         * Keputusan pencatat, bukan kesimpulan sistem: ada customer yang ingin
         * saldo depositnya tetap utuh dan membayar invoice barunya terpisah.
         */
        public bool $useDeposit = false,
        public ?string $note = null,
    ) {}

    /** @param  array<string, mixed>  $input */
    public static function fromRequest(array $input): self
    {
        return new self(
            date: Carbon::parse($input['date']),
            customerId: (int) $input['customer_id'],
            settlementMethod: SettlementMethod::from($input['settlement_method']),
            items: array_map(
                SalesInvoiceItemData::fromArray(...),
                array_values($input['items']),
            ),
            cashAccountId: isset($input['cash_account_id']) ? (int) $input['cash_account_id'] : null,
            termDays: isset($input['term_days']) ? (int) $input['term_days'] : null,
            dueDate: isset($input['due_date']) ? Carbon::parse($input['due_date']) : null,
            taxAmount: bcadd((string) ($input['tax_amount'] ?? 0), '0', 2),
            downPayment: bcadd((string) ($input['down_payment'] ?? 0), '0', 2),
            useDeposit: (bool) ($input['use_deposit'] ?? false),
            note: $input['note'] ?? null,
        );
    }

    public function subtotal(): string
    {
        return array_reduce(
            $this->items,
            fn (string $total, SalesInvoiceItemData $item) => bcadd($total, $item->amount(), 2),
            '0.00',
        );
    }

    public function total(): string
    {
        return bcadd($this->subtotal(), $this->taxAmount, 2);
    }

    public function isDeferred(): bool
    {
        return $this->settlementMethod->isDeferred();
    }

    /**
     * Tanggal jatuh tempo, dihitung dari termin bila tidak diisi langsung.
     *
     * Pengguna boleh memilih salah satu: menuliskan tanggalnya, atau memilih
     * termin lalu membiarkan sistem menghitungnya.
     */
    public function resolvedDueDate(): ?Carbon
    {
        if (! $this->isDeferred()) {
            return null;
        }

        return $this->dueDate ?? ($this->termDays !== null
            ? $this->date->copy()->addDays($this->termDays)
            : null);
    }
}
