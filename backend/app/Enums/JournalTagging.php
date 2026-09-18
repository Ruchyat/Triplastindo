<?php

namespace App\Enums;

/**
 * Penanda apakah sebuah jurnal menggerakkan kas.
 *
 * Laporan Arus Kas hanya menghitung jurnal bertanda `kas_bank`. Penandanya
 * ditentukan otomatis saat posting: jurnal yang menyentuh akun berkategori
 * Kas & Bank ditandai `kas_bank`, sisanya `non_kas_bank`.
 */
enum JournalTagging: string
{
    case KasBank = 'kas_bank';
    case NonKasBank = 'non_kas_bank';

    public function label(): string
    {
        return match ($this) {
            self::KasBank => 'Kas & Bank',
            self::NonKasBank => 'Non Kas & Bank',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
