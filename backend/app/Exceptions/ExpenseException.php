<?php

namespace App\Exceptions;

use RuntimeException;

/** Pengeluaran ditolak. Pesannya siap ditampilkan apa adanya. */
class ExpenseException extends RuntimeException
{
    public static function notACashAccount(string $code): self
    {
        return new self("Akun {$code} bukan akun Kas & Bank, sehingga tidak dapat dipakai membayar.");
    }

    public static function notAnExpenseAccount(string $code): self
    {
        return new self("Akun {$code} bukan akun beban. Pilih akun dari kelompok Beban atau HPP.");
    }

    public static function alreadyCancelled(string $number): self
    {
        return new self("Pengeluaran {$number} sudah dibatalkan.");
    }
}
