<?php

namespace App\Enums;

/**
 * Kategori pembelian — penentu akun yang dipakai jurnalnya.
 *
 * Pembelian tidak dipisah menjadi banyak menu; kategorinyalah yang membedakan
 * bahan baku, sparepart, bahan pendukung, dan seterusnya. Sebagian kategori
 * masuk ke persediaan, sebagian langsung menjadi beban.
 *
 * Pemetaan akunnya ada di `config/triplastindo.php`, bukan di sini, agar dapat
 * diubah tanpa menyentuh kode ketika COA perusahaan berkembang.
 *
 * Catatan soal karung: karung bekas adalah bahan baku utama pabrik ini, jadi
 * ia masuk kategori Bahan Baku. Karung baru dipakai sebagai wadah barang jadi,
 * jadi ia masuk Bahan Pendukung. Karung bukan kategori tersendiri.
 */
enum PurchaseCategory: string
{
    case BahanBakuPolos = 'bahan_baku_polos';
    case BahanBakuKw = 'bahan_baku_kw';
    case BahanPendukung = 'bahan_pendukung';
    case Sparepart = 'sparepart';
    case PerlengkapanProduksi = 'perlengkapan_produksi';
    case PelumasMesin = 'pelumas_mesin';
    case JasaMaintenance = 'jasa_maintenance';
    case PerlengkapanKantor = 'perlengkapan_kantor';
    case Lainnya = 'lainnya';

    public function label(): string
    {
        return match ($this) {
            self::BahanBakuPolos => 'Bahan Baku Polos',
            self::BahanBakuKw => 'Bahan Baku KW',
            self::BahanPendukung => 'Bahan Pendukung',
            self::Sparepart => 'Sparepart',
            self::PerlengkapanProduksi => 'Perlengkapan Produksi',
            self::PelumasMesin => 'Pelumas Mesin',
            self::JasaMaintenance => 'Jasa Maintenance Mesin',
            self::PerlengkapanKantor => 'Perlengkapan Kantor',
            self::Lainnya => 'Lainnya',
        };
    }

    /** Keterangan singkat yang ditampilkan di bawah pilihan pada form. */
    public function hint(): string
    {
        return match ($this) {
            self::BahanBakuPolos, self::BahanBakuKw => 'Termasuk karung bekas sebagai bahan baku utama.',
            self::BahanPendukung => 'Termasuk karung baru sebagai wadah barang jadi.',
            self::Sparepart => 'Masuk persediaan sparepart, dibebankan saat dipakai.',
            self::Lainnya => 'Akun bebannya dipilih sendiri.',
            default => 'Langsung menjadi beban, tidak disimpan sebagai persediaan.',
        };
    }

    /** Kode akun yang didebit. Kosong berarti akunnya dipilih pengguna. */
    public function debitAccount(): ?string
    {
        return config("triplastindo.purchase_categories.{$this->value}.debit");
    }

    /** Kode akun utang yang dipakai pada pembelian bertermin. */
    public function payableAccount(): string
    {
        return config("triplastindo.purchase_categories.{$this->value}.payable")
            ?? config('triplastindo.accounts.payable');
    }

    /**
     * Apakah pembeliannya masuk persediaan.
     *
     * Kategori persediaan menuntut baris itemnya menunjuk produk, sehingga
     * kartu stoknya nanti dapat mengikuti. Kategori beban cukup keterangan.
     */
    public function isStock(): bool
    {
        return in_array($this, [
            self::BahanBakuPolos,
            self::BahanBakuKw,
            self::BahanPendukung,
            self::Sparepart,
        ], strict: true);
    }

    /** Akun bebannya dipilih pengguna, bukan ditentukan kategori. */
    public function needsAccountChoice(): bool
    {
        return $this === self::Lainnya;
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
