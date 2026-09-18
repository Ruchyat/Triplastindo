<?php

namespace App\Exceptions;

use RuntimeException;

/** Tagihan pembelian ditolak. Pesannya siap ditampilkan apa adanya. */
class PurchaseBillException extends RuntimeException
{
    public static function noItems(): self
    {
        return new self('Tagihan memerlukan sedikitnya satu baris item.');
    }

    public static function nonPositiveItem(): self
    {
        return new self('Kuantitas dan harga setiap baris harus lebih besar dari nol.');
    }

    public static function itemNeedsProduct(string $category): self
    {
        return new self(
            "Kategori {$category} masuk persediaan, sehingga setiap barisnya harus menunjuk produk."
        );
    }

    public static function itemNeedsDescription(): self
    {
        return new self('Setiap baris memerlukan keterangan isi pembeliannya.');
    }

    public static function accountRequired(): self
    {
        return new self('Kategori Lainnya memerlukan akun beban yang dipilih sendiri.');
    }

    public static function unknownAccount(string $category): self
    {
        return new self(
            "Kategori {$category} belum dipetakan ke akun mana pun. Periksa pengaturan kategori pembelian."
        );
    }

    public static function cashAccountRequired(): self
    {
        return new self('Pilih akun kas atau bank yang dipakai membayar.');
    }

    public static function notACashAccount(string $code): self
    {
        return new self("Akun {$code} bukan akun Kas & Bank, sehingga tidak dapat dipakai membayar.");
    }

    public static function dueDateRequired(): self
    {
        return new self('Pembelian dengan termin memerlukan tanggal jatuh tempo.');
    }

    public static function downPaymentOnNonCredit(): self
    {
        return new self('DP hanya berlaku pada pembelian dengan termin.');
    }

    public static function downPaymentTooLarge(): self
    {
        return new self('DP tidak boleh melebihi total tagihan.');
    }

    public static function alreadyPosted(string $number): self
    {
        return new self("Tagihan {$number} sudah diposting dan jurnalnya sudah terbentuk.");
    }

    public static function notPosted(string $number): self
    {
        return new self("Tagihan {$number} masih draft. Hapus saja, tidak perlu dibatalkan.");
    }

    public static function alreadyCancelled(string $number): self
    {
        return new self("Tagihan {$number} sudah dibatalkan.");
    }

    public static function hasPayments(string $number): self
    {
        return new self(
            "Tagihan {$number} sudah dibayar sebagian. Batalkan pembayarannya terlebih dahulu."
        );
    }

    public static function draftOnly(string $number): self
    {
        return new self("Tagihan {$number} sudah diposting dan tidak dapat dihapus. Batalkan tagihannya.");
    }
}
