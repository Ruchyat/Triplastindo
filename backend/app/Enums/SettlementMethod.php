<?php

namespace App\Enums;

/**
 * Cara sebuah dokumen dagang diselesaikan.
 *
 * Hanya dua: diselesaikan sekarang, atau ditunda. Kas dan bank tidak lagi
 * dipisah sebagai metode — rekening penerimanya sudah dipilih tersendiri lewat
 * akun Kas & Bank, sehingga memisahkannya di sini hanya menanyakan hal yang
 * sama dua kali.
 *
 * "Tunai" berarti selesai saat itu juga, bukan berarti berupa uang fisik. Ia
 * juga mencakup invoice yang seluruhnya tertutup saldo deposit customer,
 * sehingga tidak ada uang yang berpindah sama sekali.
 */
enum SettlementMethod: string
{
    case Cash = 'cash';
    case Receivable = 'receivable';
    case Payable = 'payable';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Tunai',
            self::Receivable => 'Piutang',
            self::Payable => 'Utang',
        };
    }

    /** Dibayar belakangan, sehingga membentuk piutang atau utang. */
    public function isDeferred(): bool
    {
        return $this === self::Receivable || $this === self::Payable;
    }

    /** Metode yang sah pada invoice penjualan. */
    public static function forSales(): array
    {
        return [self::Cash->value, self::Receivable->value];
    }

    /** Metode yang sah pada tagihan pembelian. */
    public static function forPurchases(): array
    {
        return [self::Cash->value, self::Payable->value];
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
