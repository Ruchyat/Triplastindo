<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Invoice penjualan ditolak.
 *
 * Seperti JournalPostingException, pesannya ditulis dalam bahasa yang langsung
 * dapat ditampilkan kepada pengguna.
 */
class SalesInvoiceException extends RuntimeException
{
    public static function noItems(): self
    {
        return new self('Invoice memerlukan sedikitnya satu baris produk.');
    }

    public static function nonPositiveItem(): self
    {
        return new self('Kuantitas dan harga setiap baris harus lebih besar dari nol.');
    }

    public static function cashAccountRequired(): self
    {
        return new self('Pilih akun kas atau bank yang menerima pembayaran.');
    }

    public static function notACashAccount(string $code): self
    {
        return new self("Akun {$code} bukan akun Kas & Bank, sehingga tidak dapat menerima pembayaran.");
    }

    public static function dueDateRequired(): self
    {
        return new self('Penjualan dengan termin memerlukan tanggal jatuh tempo.');
    }

    public static function downPaymentOnNonCredit(): self
    {
        return new self('DP hanya berlaku pada penjualan dengan termin.');
    }

    public static function downPaymentTooLarge(): self
    {
        return new self('DP tidak boleh melebihi total invoice.');
    }

    public static function alreadyPosted(string $number): self
    {
        return new self("Invoice {$number} sudah diposting dan jurnalnya sudah terbentuk.");
    }

    public static function notPosted(string $number): self
    {
        return new self("Invoice {$number} masih draft. Hapus saja, tidak perlu dibatalkan.");
    }

    public static function alreadyCancelled(string $number): self
    {
        return new self("Invoice {$number} sudah dibatalkan.");
    }

    public static function hasPayments(string $number): self
    {
        return new self(
            "Invoice {$number} sudah menerima pembayaran. Batalkan penerimaan pembayarannya terlebih dahulu."
        );
    }

    public static function draftOnly(string $number): self
    {
        return new self("Invoice {$number} sudah diposting dan tidak dapat dihapus. Batalkan invoicenya.");
    }
}
