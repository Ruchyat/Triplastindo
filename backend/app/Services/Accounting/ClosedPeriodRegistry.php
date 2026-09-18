<?php

namespace App\Services\Accounting;

use App\Enums\PeriodStatus;
use App\Models\FiscalPeriod;
use Carbon\CarbonInterface;

/**
 * Mengingat bulan mana saja yang sudah ditutup, selama satu permintaan.
 *
 * Tanpa ini, daftar jurnal menjalankan satu kueri per baris hanya untuk
 * menentukan apakah barisnya masih dapat disunting — padahal status periode
 * tidak berubah di tengah-tengah satu permintaan.
 *
 * Didaftarkan sebagai singleton, bukan disimpan pada properti statis: container
 * dibangun ulang setiap permintaan dan setiap test, sehingga ingatannya ikut
 * hilang dengan sendirinya. Properti statis akan terbawa antar-permintaan pada
 * proses yang berumur panjang, dan antar-test pada satu proses PHPUnit.
 */
final class ClosedPeriodRegistry
{
    /** @var array<string, bool> */
    private array $checked = [];

    public function isClosed(CarbonInterface $date): bool
    {
        $key = $date->format('Y-m');

        return $this->checked[$key] ??= FiscalPeriod::query()
            ->where('year', $date->year)
            ->where('month', $date->month)
            ->where('status', PeriodStatus::Closed)
            ->exists();
    }

    /** Melupakan ingatannya; dipakai setelah sebuah periode ditutup atau dibuka. */
    public function forget(): void
    {
        $this->checked = [];
    }
}
