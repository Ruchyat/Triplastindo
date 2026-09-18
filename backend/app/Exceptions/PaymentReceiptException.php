<?php

namespace App\Exceptions;

use RuntimeException;

/** Penerimaan pembayaran ditolak. Pesannya siap ditampilkan apa adanya. */
class PaymentReceiptException extends RuntimeException
{
    public static function noAllocations(): self
    {
        return new self('Pilih sedikitnya satu invoice yang dilunasi oleh penerimaan ini.');
    }

    public static function nonPositiveAmount(string $number): self
    {
        return new self("Nilai pelunasan untuk invoice {$number} harus lebih besar dari nol.");
    }

    public static function notACashAccount(string $code): self
    {
        return new self("Akun {$code} bukan akun Kas & Bank, sehingga tidak dapat menerima pembayaran.");
    }

    public static function foreignInvoice(string $number): self
    {
        return new self(
            "Invoice {$number} milik customer lain. Satu bukti penerimaan hanya untuk satu customer."
        );
    }

    public static function notOutstanding(string $number): self
    {
        return new self("Invoice {$number} tidak sedang menunggu pembayaran.");
    }

    public static function exceedsOutstanding(string $number, string $outstanding): self
    {
        return new self(
            "Pelunasan invoice {$number} melebihi sisa piutangnya yang sebesar {$outstanding}."
        );
    }

    public static function alreadyCancelled(string $number): self
    {
        return new self("Penerimaan {$number} sudah dibatalkan.");
    }
}
