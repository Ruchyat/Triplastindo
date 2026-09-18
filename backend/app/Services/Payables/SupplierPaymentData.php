<?php

namespace App\Services\Payables;

use Illuminate\Support\Carbon;

/**
 * Isi sebuah bukti pembayaran supplier.
 *
 * Nilai buktinya dijumlahkan dari alokasinya, sama seperti penerimaan
 * pembayaran, sehingga total dan rinciannya tidak mungkin berbeda.
 */
final readonly class SupplierPaymentData
{
    /** @param  list<SupplierPaymentAllocationData>  $allocations */
    public function __construct(
        public Carbon $date,
        public int $supplierId,
        public int $cashAccountId,
        public array $allocations,
        public ?string $reference = null,
        public ?string $note = null,
    ) {}

    /** @param  array<string, mixed>  $input */
    public static function fromRequest(array $input): self
    {
        return new self(
            date: Carbon::parse($input['date']),
            supplierId: (int) $input['supplier_id'],
            cashAccountId: (int) $input['cash_account_id'],
            allocations: array_map(
                SupplierPaymentAllocationData::fromArray(...),
                array_values($input['allocations']),
            ),
            reference: $input['reference'] ?? null,
            note: $input['note'] ?? null,
        );
    }

    public function total(): string
    {
        return array_reduce(
            $this->allocations,
            fn (string $sum, SupplierPaymentAllocationData $row) => bcadd($sum, $row->amount, 2),
            '0.00',
        );
    }
}
