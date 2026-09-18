<?php

namespace App\Services\Accounting;

use App\Enums\JournalSource;
use App\Enums\JournalTagging;
use Illuminate\Support\Carbon;

/**
 * Satu transaksi yang diajukan ke JournalPoster.
 *
 * Objek ini adalah bahasa bersama seluruh modul: penjualan, pembelian,
 * pengeluaran, payroll, dan penyusutan semuanya menyusun JournalDraft, lalu
 * menyerahkannya ke poster. Dengan begitu aturan keseimbangan hanya ditulis
 * satu kali dan tidak dapat dilewati oleh modul mana pun.
 */
final readonly class JournalDraft
{
    /** @param  list<JournalLineDraft>  $lines */
    public function __construct(
        public Carbon $date,
        public string $description,
        public array $lines,
        public int $createdBy,
        public JournalSource $source = JournalSource::Manual,
        public ?int $sourceId = null,
        /** Nomor dokumen asal, misalnya `INV/2026/09/0001`. */
        public ?string $sourceNumber = null,
        public ?string $paymentMethod = null,
        public ?string $attachmentPath = null,
        /**
         * Penanda arus kas. Dibiarkan kosong pada pemakaian biasa agar poster
         * menyimpulkannya sendiri dari akun yang terlibat.
         */
        public ?JournalTagging $tagging = null,
    ) {}

    /** @return list<string> Kode akun yang dipakai, tanpa duplikat. */
    public function accountCodes(): array
    {
        return array_values(array_unique(
            array_map(fn (JournalLineDraft $line) => $line->accountCode(), $this->lines)
        ));
    }

    public function totalDebit(): string
    {
        return $this->sum(fn (JournalLineDraft $line) => $line->debitAmount());
    }

    public function totalCredit(): string
    {
        return $this->sum(fn (JournalLineDraft $line) => $line->creditAmount());
    }

    private function sum(callable $pick): string
    {
        return array_reduce(
            $this->lines,
            fn (string $total, JournalLineDraft $line) => bcadd($total, $pick($line), 2),
            '0.00',
        );
    }
}
