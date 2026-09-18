<?php

namespace App\Exceptions;

use RuntimeException;

/** Mutasi deposit ditolak. Pesannya siap ditampilkan apa adanya. */
class CustomerDepositException extends RuntimeException
{
    public static function nonPositiveAmount(): self
    {
        return new self('Nilai deposit harus lebih besar dari nol.');
    }

    public static function notACashAccount(string $code): self
    {
        return new self("Akun {$code} bukan akun Kas & Bank, sehingga tidak dapat dipakai untuk deposit.");
    }

    public static function insufficientBalance(string $balance): self
    {
        return new self("Saldo deposit customer hanya {$balance} dan tidak cukup untuk pengembalian ini.");
    }

    public static function alreadyCancelled(string $number): self
    {
        return new self("Mutasi deposit {$number} sudah dibatalkan.");
    }

    public static function systemMovement(string $number): self
    {
        return new self(
            "Mutasi {$number} terbentuk otomatis dari invoice. Batalkan invoicenya bila ingin mengembalikan saldonya."
        );
    }

    public static function balanceWouldGoNegative(string $number): self
    {
        return new self(
            "Deposit {$number} sudah terpakai pada invoice. Batalkan pemakaiannya terlebih dahulu."
        );
    }
}
