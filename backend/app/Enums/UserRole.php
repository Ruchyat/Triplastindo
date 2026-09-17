<?php

namespace App\Enums;

/**
 * Peran pengguna Triplastindo Finance.
 *
 * Mengikuti matriks hak akses pada dokumen spesifikasi. Untuk tahap ini peran
 * hanya disimpan sebagai satu kolom pada tabel users; matriks izin per modul
 * dibangun ketika modul-modulnya mulai dikerjakan.
 */
enum UserRole: string
{
    /** Kelola user, hak akses, setup, periode, dan seluruh data. */
    case SuperAdmin = 'super_admin';

    /** Input dan edit transaksi, utang, piutang, aset, tutup buku, semua laporan. */
    case Finance = 'finance';

    /** Kelola karyawan, input gaji, cetak slip gaji. */
    case Hr = 'hr';

    /** Baca dashboard dan laporan, menyetujui pembagian laba. */
    case Direksi = 'direksi';

    /** Hanya baca: laporan ringkas dan dividen miliknya sendiri. */
    case Viewer = 'viewer';

    /** Label yang ditampilkan pada antarmuka. */
    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Finance => 'Finance / Akuntan',
            self::Hr => 'HR / Payroll',
            self::Direksi => 'Direksi / Owner',
            self::Viewer => 'Viewer / Pemegang Saham',
        };
    }

    /** Daftar nilai peran, dipakai untuk aturan validasi. */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
