<?php

namespace App\Enums;

/**
 * Asal sebuah jurnal.
 *
 * Setiap jurnal tetap bernomor `JU/YYYY/MM/NNNN` dan tampil di Jurnal Umum,
 * persis seperti di Google Sheet. Enum ini menjawab pertanyaan lain: dokumen
 * apa yang melahirkannya. Nilainya dipasangkan dengan kolom `source_id` yang
 * menunjuk ke baris dokumen asalnya — invoice penjualan, tagihan pembelian,
 * dan seterusnya.
 *
 * `Manual` adalah satu-satunya asal yang boleh dibuat langsung oleh pengguna
 * lewat halaman Jurnal Manual. Sisanya lahir sebagai efek samping modul.
 */
enum JournalSource: string
{
    case Manual = 'manual';
    case Sale = 'sale';
    case Purchase = 'purchase';
    case Expense = 'expense';
    case CashReceipt = 'cash_receipt';
    case CashPayment = 'cash_payment';
    case CashTransfer = 'cash_transfer';
    case CustomerDeposit = 'customer_deposit';
    case Payroll = 'payroll';
    case Depreciation = 'depreciation';
    case ProfitDistribution = 'profit_distribution';
    case OpeningBalance = 'opening_balance';
    case PeriodClosing = 'period_closing';

    public function label(): string
    {
        return match ($this) {
            self::Manual => 'Jurnal Manual',
            self::Sale => 'Penjualan',
            self::Purchase => 'Pembelian',
            self::Expense => 'Pengeluaran',
            self::CashReceipt => 'Penerimaan Kas',
            self::CashPayment => 'Pembayaran Kas',
            self::CashTransfer => 'Transfer Kas',
            self::CustomerDeposit => 'Deposit Customer',
            self::Payroll => 'Payroll',
            self::Depreciation => 'Penyusutan',
            self::ProfitDistribution => 'Bagi Hasil',
            self::OpeningBalance => 'Saldo Awal',
            self::PeriodClosing => 'Tutup Buku',
        };
    }

    /** Jurnal yang boleh disunting dan dihapus langsung oleh pengguna. */
    public function isManual(): bool
    {
        return $this === self::Manual;
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
