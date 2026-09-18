<?php

namespace App\Services\Expenses;

use Illuminate\Support\Carbon;

/** Isi sebuah bukti pengeluaran. */
final readonly class ExpenseData
{
    public function __construct(
        public Carbon $date,
        public int $expenseAccountId,
        public int $cashAccountId,
        public string $description,
        public string $amount,
        public ?string $payee = null,
        public ?string $reference = null,
        public ?string $note = null,
    ) {}

    /** @param  array<string, mixed>  $input */
    public static function fromRequest(array $input): self
    {
        return new self(
            date: Carbon::parse($input['date']),
            expenseAccountId: (int) $input['expense_account_id'],
            cashAccountId: (int) $input['cash_account_id'],
            description: $input['description'],
            amount: bcadd((string) $input['amount'], '0', 2),
            payee: $input['payee'] ?? null,
            reference: $input['reference'] ?? null,
            note: $input['note'] ?? null,
        );
    }
}
