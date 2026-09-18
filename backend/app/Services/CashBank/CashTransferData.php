<?php

namespace App\Services\CashBank;

use Illuminate\Support\Carbon;

/** Isi sebuah transfer antar akun kas/bank. */
final readonly class CashTransferData
{
    public function __construct(
        public Carbon $date,
        public int $fromAccountId,
        public int $toAccountId,
        public string $amount,
        public ?string $reference = null,
        public ?string $note = null,
    ) {}

    /** @param  array<string, mixed>  $input */
    public static function fromRequest(array $input): self
    {
        return new self(
            date: Carbon::parse($input['date']),
            fromAccountId: (int) $input['from_account_id'],
            toAccountId: (int) $input['to_account_id'],
            amount: bcadd((string) $input['amount'], '0', 2),
            reference: $input['reference'] ?? null,
            note: $input['note'] ?? null,
        );
    }
}
