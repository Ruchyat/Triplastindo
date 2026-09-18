<?php

namespace App\Services\Deposits;

use App\Enums\DepositMovement;
use Illuminate\Support\Carbon;

/** Isi sebuah mutasi deposit yang dibuat pengguna: masuk atau dikembalikan. */
final readonly class CustomerDepositData
{
    public function __construct(
        public Carbon $date,
        public int $customerId,
        public DepositMovement $movement,
        public string $amount,
        public int $cashAccountId,
        public ?string $reference = null,
        public ?string $note = null,
    ) {}

    /** @param  array<string, mixed>  $input */
    public static function fromRequest(array $input): self
    {
        return new self(
            date: Carbon::parse($input['date']),
            customerId: (int) $input['customer_id'],
            movement: DepositMovement::from($input['movement']),
            amount: bcadd((string) $input['amount'], '0', 2),
            cashAccountId: (int) $input['cash_account_id'],
            reference: $input['reference'] ?? null,
            note: $input['note'] ?? null,
        );
    }
}
