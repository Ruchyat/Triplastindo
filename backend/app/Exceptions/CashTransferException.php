<?php

namespace App\Exceptions;

use RuntimeException;

/** Transfer kas ditolak. Pesannya siap ditampilkan apa adanya. */
class CashTransferException extends RuntimeException
{
    public static function notACashAccount(string $code): self
    {
        return new self("Akun {$code} bukan akun Kas & Bank.");
    }

    public static function sameAccount(): self
    {
        return new self('Akun asal dan akun tujuan tidak boleh sama.');
    }

    public static function alreadyCancelled(string $number): self
    {
        return new self("Transfer {$number} sudah dibatalkan.");
    }
}
