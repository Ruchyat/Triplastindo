<?php

namespace App\Enums;

/**
 * Saldo normal sebuah akun.
 *
 * Menentukan arah penambahan saldo: akun bersaldo normal Debit bertambah di
 * sisi debit, akun bersaldo normal Kredit bertambah di sisi kredit. Buku Besar
 * memakainya untuk menghitung saldo berjalan.
 */
enum NormalBalance: string
{
    case Debit = 'debit';
    case Kredit = 'kredit';

    public function label(): string
    {
        return match ($this) {
            self::Debit => 'Debit',
            self::Kredit => 'Kredit',
        };
    }

    /**
     * Saldo akun dari total debit dan kredit, sesuai arah saldo normalnya.
     *
     * Hasil positif berarti saldo searah dengan saldo normal.
     */
    public function balanceOf(string $debit, string $credit): string
    {
        return $this === self::Debit
            ? bcsub($debit, $credit, 2)
            : bcsub($credit, $debit, 2);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
