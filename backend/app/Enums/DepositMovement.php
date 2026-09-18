<?php

namespace App\Enums;

/**
 * Jenis mutasi pada kartu deposit pelanggan.
 *
 * `Applied` tidak pernah dibuat pengguna: ia lahir sendiri ketika invoice
 * kredit diposting dan saldo deposit customer dipotong. Karena itu ia juga
 * tidak punya jurnal sendiri — potongannya sudah menjadi salah satu baris pada
 * jurnal invoicenya.
 */
enum DepositMovement: string
{
    case Received = 'received';
    case Applied = 'applied';
    case Refunded = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::Received => 'Deposit Masuk',
            self::Applied => 'Digunakan pada Invoice',
            self::Refunded => 'Dikembalikan',
        };
    }

    /** Menambah saldo deposit customer; sisanya mengurangi. */
    public function isIncoming(): bool
    {
        return $this === self::Received;
    }

    /** Jenis yang boleh dibuat langsung oleh pengguna. */
    public static function userCreatable(): array
    {
        return [self::Received->value, self::Refunded->value];
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
