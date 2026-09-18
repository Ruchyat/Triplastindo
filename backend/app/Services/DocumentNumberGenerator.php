<?php

namespace App\Services;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Pembuat nomor dokumen `PREFIX/2026/09/0001`.
 *
 * Urutannya dimulai ulang setiap bulan, mengikuti kebiasaan pembukuan di
 * Google Sheet yang sedang dipakai. Dipakai bersama oleh jurnal (`JU`),
 * invoice penjualan (`INV`), dan dokumen lain yang menyusul.
 */
final class DocumentNumberGenerator
{
    /**
     * Nomor berikutnya untuk bulan pada tanggal tersebut.
     *
     * Harus dipanggil di dalam transaksi database: barisnya dikunci supaya dua
     * proses yang menyimpan bersamaan tidak memperoleh nomor yang sama.
     * Dokumen yang sudah dihapus tetap dihitung agar nomornya tidak dipakai
     * ulang — nomor yang hilang dari urutan adalah petunjuk audit, nomor yang
     * dipakai ulang menghilangkan petunjuk itu.
     *
     * @param  class-string<Model>  $model
     */
    public function next(string $prefix, CarbonInterface $date, string $model): string
    {
        $stem = sprintf('%s/%s/%s/', $prefix, $date->format('Y'), $date->format('m'));

        $query = $model::query();

        if (in_array(SoftDeletes::class, class_uses_recursive($model), true)) {
            $query->withTrashed();
        }

        $last = $query->where('number', 'like', "{$stem}%")
            ->lockForUpdate()
            ->max('number');

        $sequence = $last === null ? 1 : ((int) substr($last, -4)) + 1;

        return $stem.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
