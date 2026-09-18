<?php

namespace App\Enums;

/**
 * Status bukti penerimaan pembayaran.
 *
 * Lebih sederhana daripada status dokumen dagang: penerimaan tidak mengenal
 * draft maupun cicilan. Uangnya sudah masuk, atau pencatatannya dibatalkan.
 */
enum ReceiptStatus: string
{
    case Posted = 'posted';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Posted => 'Diposting',
            self::Cancelled => 'Dibatalkan',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
