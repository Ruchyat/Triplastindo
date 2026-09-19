<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;

/**
 * Pembuat kode master data berurutan: `CUS-005`, `SUP-004`, `PRD-0001`.
 *
 * Kode boleh diisi sendiri oleh pengguna; generator ini hanya dipakai ketika
 * dikosongkan. Lebar angkanya mengikuti kode yang sudah ada — seeder memakai
 * tiga digit untuk customer dan supplier — dan empat digit bila belum ada
 * kode bernomor sama sekali. Kode yang tidak berpola angka, seperti
 * `PRD-TAL`, tidak ikut dihitung.
 *
 * Harus dipanggil di dalam transaksi database: barisnya dikunci agar dua
 * penyimpanan bersamaan tidak memperoleh kode yang sama.
 */
final class MasterCodeGenerator
{
    private const MIN_WIDTH = 4;

    /** @param  class-string<Model>  $model */
    public function next(string $model, string $prefix): string
    {
        $suffixes = $model::query()
            ->where('code', 'like', "{$prefix}-%")
            ->lockForUpdate()
            ->pluck('code')
            ->map(fn (string $code) => substr($code, strlen($prefix) + 1))
            ->filter(fn (string $suffix) => ctype_digit($suffix));

        $sequence = ($suffixes->map(fn (string $suffix) => (int) $suffix)->max() ?? 0) + 1;
        $width = $suffixes->isEmpty() ? self::MIN_WIDTH : $suffixes->map(strlen(...))->max();

        return "{$prefix}-".str_pad((string) $sequence, $width, '0', STR_PAD_LEFT);
    }
}
