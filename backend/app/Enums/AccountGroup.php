<?php

namespace App\Enums;

/**
 * Kelompok akun pada laporan keuangan.
 *
 * Satu tingkat di atas kategori akun. Kategori "Kas & Bank" dan "Persediaan"
 * misalnya sama-sama berada pada kelompok Aset Lancar. Kelompoklah yang
 * menentukan sebuah akun muncul di Neraca atau di Laba Rugi.
 */
enum AccountGroup: string
{
    case AsetLancar = 'aset_lancar';
    case AsetTidakLancar = 'aset_tidak_lancar';
    case KontraAset = 'kontra_aset';
    case Liabilitas = 'liabilitas';
    case Ekuitas = 'ekuitas';
    case Pendapatan = 'pendapatan';
    case Hpp = 'hpp';
    case Beban = 'beban';
    case PendapatanLain = 'pendapatan_lain';
    case BebanLain = 'beban_lain';
    case Pajak = 'pajak';

    public function label(): string
    {
        return match ($this) {
            self::AsetLancar => 'Aset Lancar',
            self::AsetTidakLancar => 'Aset Tidak Lancar',
            self::KontraAset => 'Kontra Aset',
            self::Liabilitas => 'Liabilitas',
            self::Ekuitas => 'Ekuitas',
            self::Pendapatan => 'Pendapatan',
            self::Hpp => 'HPP',
            self::Beban => 'Beban',
            self::PendapatanLain => 'Pendapatan Lain',
            self::BebanLain => 'Beban Lain',
            self::Pajak => 'Pajak',
        };
    }

    /** Laporan tempat kelompok ini ditampilkan. */
    public function statement(): FinancialStatement
    {
        return match ($this) {
            self::AsetLancar, self::AsetTidakLancar, self::KontraAset,
            self::Liabilitas, self::Ekuitas => FinancialStatement::Neraca,
            default => FinancialStatement::LabaRugi,
        };
    }

    /**
     * Apakah saldo kelompok ini ikut ditutup ke ekuitas pada akhir periode.
     *
     * Akun Neraca membawa saldonya ke periode berikutnya, akun Laba Rugi tidak.
     */
    public function isTemporary(): bool
    {
        return $this->statement() === FinancialStatement::LabaRugi;
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
