<?php

namespace App\Enums;

/** Laporan keuangan tempat sebuah kelompok akun bermuara. */
enum FinancialStatement: string
{
    case Neraca = 'neraca';
    case LabaRugi = 'laba_rugi';

    public function label(): string
    {
        return match ($this) {
            self::Neraca => 'Neraca',
            self::LabaRugi => 'Laba Rugi',
        };
    }
}
