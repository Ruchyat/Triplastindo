<?php

namespace App\Enums;

/** Pengelompokan produk dan item yang dipakai dokumen transaksi. */
enum ProductCategory: string
{
    case Tali = 'tali';
    case BijiPlastik = 'biji_plastik';
    case BahanBaku = 'bahan_baku';
    case Sparepart = 'sparepart';
    case BahanPendukung = 'bahan_pendukung';
    case Lainnya = 'lainnya';

    public function label(): string
    {
        return match ($this) {
            self::Tali => 'Tali',
            self::BijiPlastik => 'Biji Plastik',
            self::BahanBaku => 'Bahan Baku',
            self::Sparepart => 'Sparepart',
            self::BahanPendukung => 'Bahan Pendukung',
            self::Lainnya => 'Lainnya',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
