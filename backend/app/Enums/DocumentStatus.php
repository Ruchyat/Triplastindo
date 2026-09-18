<?php

namespace App\Enums;

/**
 * Status dokumen dagang.
 *
 * `Draft` berarti dokumen tersimpan tetapi belum menghasilkan jurnal; angkanya
 * belum masuk laporan mana pun. `Cancelled` berarti dokumen dibatalkan setelah
 * diposting, dan jurnalnya sudah dibalik.
 *
 * `Overdue` tidak pernah disimpan ke database. Ia disimpulkan dari tanggal
 * jatuh tempo saat dibaca, supaya status tidak perlu diperbarui oleh penjadwal
 * setiap hari.
 */
enum DocumentStatus: string
{
    case Draft = 'draft';
    case Unpaid = 'unpaid';
    case Partial = 'partial';
    case Paid = 'paid';
    case Overdue = 'overdue';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Unpaid => 'Belum Bayar',
            self::Partial => 'Sebagian',
            self::Paid => 'Lunas',
            self::Overdue => 'Jatuh Tempo',
            self::Cancelled => 'Dibatalkan',
        };
    }

    /** Status yang benar-benar disimpan pada kolom database. */
    public static function stored(): array
    {
        return [
            self::Draft->value,
            self::Unpaid->value,
            self::Partial->value,
            self::Paid->value,
            self::Cancelled->value,
        ];
    }

    /** Dokumen yang masih menunggu pembayaran. */
    public function isOutstanding(): bool
    {
        return $this === self::Unpaid || $this === self::Partial;
    }
}
