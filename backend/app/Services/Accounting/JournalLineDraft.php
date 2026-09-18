<?php

namespace App\Services\Accounting;

use App\Exceptions\JournalPostingException;
use App\Models\Account;

/**
 * Satu baris yang diajukan ke JournalPoster.
 *
 * Nominal disimpan sebagai string, bukan float. Rupiah dihitung sampai dua
 * desimal dan penjumlahan float tidak selalu menghasilkan angka yang persis —
 * pada jurnal, selisih satu sen berarti transaksi ditolak.
 */
final readonly class JournalLineDraft
{
    private function __construct(
        /** Kode akun (`1-10001`) atau model akun yang sudah dimuat. */
        public Account|string $account,
        public string $amount,
        public bool $isDebit,
        public ?string $description = null,
    ) {}

    public static function debit(Account|string $account, string|int|float $amount, ?string $description = null): self
    {
        return new self($account, self::normalize($amount), true, $description);
    }

    public static function credit(Account|string $account, string|int|float $amount, ?string $description = null): self
    {
        return new self($account, self::normalize($amount), false, $description);
    }

    public function accountCode(): string
    {
        return $this->account instanceof Account ? $this->account->code : $this->account;
    }

    public function debitAmount(): string
    {
        return $this->isDebit ? $this->amount : '0.00';
    }

    public function creditAmount(): string
    {
        return $this->isDebit ? '0.00' : $this->amount;
    }

    /** @throws JournalPostingException */
    public function assertPositive(): void
    {
        if (bccomp($this->amount, '0', 2) <= 0) {
            throw JournalPostingException::nonPositiveAmount($this->accountCode());
        }
    }

    private static function normalize(string|int|float $amount): string
    {
        return bcadd((string) $amount, '0', 2);
    }
}
