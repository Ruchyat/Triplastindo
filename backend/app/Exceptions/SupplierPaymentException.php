<?php

namespace App\Exceptions;

use RuntimeException;

/** Pembayaran supplier ditolak. Pesannya siap ditampilkan apa adanya. */
class SupplierPaymentException extends RuntimeException
{
    public static function noAllocations(): self
    {
        return new self('Pilih sedikitnya satu tagihan yang dibayar oleh pembayaran ini.');
    }

    public static function nonPositiveAmount(string $number): self
    {
        return new self("Nilai pembayaran untuk tagihan {$number} harus lebih besar dari nol.");
    }

    public static function notACashAccount(string $code): self
    {
        return new self("Akun {$code} bukan akun Kas & Bank, sehingga tidak dapat dipakai membayar.");
    }

    public static function foreignBill(string $number): self
    {
        return new self(
            "Tagihan {$number} milik supplier lain. Satu bukti pembayaran hanya untuk satu supplier."
        );
    }

    public static function notOutstanding(string $number): self
    {
        return new self("Tagihan {$number} tidak sedang menunggu pembayaran.");
    }

    public static function exceedsOutstanding(string $number, string $outstanding): self
    {
        return new self(
            "Pembayaran tagihan {$number} melebihi sisa utangnya yang sebesar {$outstanding}."
        );
    }

    public static function alreadyCancelled(string $number): self
    {
        return new self("Pembayaran {$number} sudah dibatalkan.");
    }
}
