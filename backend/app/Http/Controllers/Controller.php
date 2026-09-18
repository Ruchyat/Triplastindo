<?php

namespace App\Http\Controllers;

abstract class Controller
{
    /**
     * Menormalkan hasil agregasi menjadi string uang dua desimal.
     *
     * `SUM()` mengembalikan `null` saat tidak ada baris dan `0` saat hasilnya
     * nol, sehingga tanpa ini jawaban API kadang berisi `"0"` dan kadang
     * `"0.00"`. Kontrak API menjanjikan dua desimal untuk seluruh nilai uang.
     */
    protected function money(mixed $value): string
    {
        return bcadd((string) ($value ?? 0), '0', 2);
    }
}
