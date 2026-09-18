<?php

namespace App\Services\Receivables;

use Illuminate\Support\Carbon;

/**
 * Isi sebuah bukti penerimaan pembayaran.
 *
 * Nilai buktinya tidak diisi pengguna melainkan dijumlahkan dari alokasinya,
 * sehingga total dan rinciannya tidak mungkin berbeda.
 */
final readonly class PaymentReceiptData
{
    /** @param  list<PaymentAllocationData>  $allocations */
    public function __construct(
        public Carbon $date,
        public int $customerId,
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
            customerId: (int) $input['customer_id'],
            cashAccountId: (int) $input['cash_account_id'],
            allocations: array_map(
                PaymentAllocationData::fromArray(...),
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
            fn (string $sum, PaymentAllocationData $row) => bcadd($sum, $row->amount, 2),
            '0.00',
        );
    }
}
