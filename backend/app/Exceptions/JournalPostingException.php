<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Jurnal ditolak sebelum tersimpan.
 *
 * Seluruh penyebabnya adalah pelanggaran aturan akuntansi, bukan kesalahan
 * teknis — karena itu pesannya ditulis dalam bahasa yang langsung dapat
 * ditampilkan kepada pengguna.
 */
class JournalPostingException extends RuntimeException
{
    public static function unbalanced(string $debit, string $credit): self
    {
        return new self(
            "Jurnal tidak seimbang. Total debit {$debit} tidak sama dengan total kredit {$credit}."
        );
    }

    public static function tooFewLines(): self
    {
        return new self('Jurnal memerlukan sedikitnya dua baris: satu debit dan satu kredit.');
    }

    public static function emptySide(): self
    {
        return new self('Jurnal memerlukan sedikitnya satu baris debit dan satu baris kredit.');
    }

    public static function nonPositiveAmount(string $accountCode): self
    {
        return new self("Nominal baris akun {$accountCode} harus lebih besar dari nol.");
    }

    public static function unknownAccount(string $accountCode): self
    {
        return new self("Akun {$accountCode} tidak terdaftar pada Chart of Accounts.");
    }

    public static function inactiveAccount(string $accountCode): self
    {
        return new self("Akun {$accountCode} sudah dinonaktifkan dan tidak dapat dipakai.");
    }

    public static function closedPeriod(int $year, int $month): self
    {
        $period = str_pad((string) $month, 2, '0', STR_PAD_LEFT)."/{$year}";

        return new self("Periode {$period} sudah ditutup. Jurnal tidak dapat dibuat pada periode tertutup.");
    }
}
