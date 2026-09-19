<?php

namespace App\Services\Reports;

use App\Enums\AccountGroup;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Laporan Arus Kas metode langsung, mengikuti tab LAPORAN ARUS KAS di sheet:
 *
 *   Operasi   : Penerimaan Kas dari Pelanggan · Pembayaran atas Beban Usaha
 *   Investasi : Pembelian Aset Tetap · Penjualan Aset Tetap
 *   Pendanaan : Modal Disetor · Tambahan Modal · Dividen · Pinjaman · Angsuran
 *   Saldo Kas Awal + Arus Kas Bersih = Saldo Kas Akhir
 *
 * Di sheet, kolom kategori arus kas diisi manual per jurnal. Di sini ia
 * disimpulkan dari akun lawan tiap jurnal yang menyentuh kas: lawan aset tetap
 * berarti investasi, lawan ekuitas atau utang jangka panjang berarti
 * pendanaan, selebihnya operasi. Transfer antar akun kas tidak dihitung.
 */
final class CashFlowReport
{
    private const LINES = [
        'operating' => [
            'customer_receipts' => 'Penerimaan Kas dari Pelanggan',
            'other_receipts' => 'Penerimaan Kas Lainnya',
            'operating_payments' => 'Pembayaran atas Beban Usaha',
        ],
        'investing' => [
            'asset_purchases' => 'Pembelian Aset Tetap',
            'asset_sales' => 'Penjualan Aset Tetap',
        ],
        'financing' => [
            'capital_in' => 'Modal Disetor',
            'dividends' => 'Dividen',
            'loan_in' => 'Penerimaan Pinjaman / Leasing',
            'loan_out' => 'Pembayaran Angsuran Pinjaman / Leasing',
        ],
    ];

    private const TITLES = [
        'operating' => 'ARUS KAS DARI AKTIVITAS OPERASI',
        'investing' => 'ARUS KAS DARI AKTIVITAS INVESTASI',
        'financing' => 'ARUS KAS DARI AKTIVITAS PENDANAAN',
    ];

    /** @return array<string, mixed> */
    public function build(CarbonInterface $from, CarbonInterface $to): array
    {
        $cashIds = Account::query()->where('is_cash', true)->pluck('id');

        $opening = $this->cashBalance($cashIds, null, $from->copy()->subDay()->endOfDay());

        $entries = JournalEntry::query()
            ->with('lines.account.category')
            ->whereHas('lines', fn ($q) => $q->whereIn('account_id', $cashIds))
            ->whereDate('date', '>=', $from)
            ->whereDate('date', '<=', $to)
            ->get();

        $amounts = [];
        foreach (self::LINES as $activity => $lines) {
            foreach (array_keys($lines) as $key) {
                $amounts[$key] = '0.00';
            }
        }

        foreach ($entries as $entry) {
            $cashLines = $entry->lines->filter(fn (JournalLine $line) => $cashIds->contains($line->account_id));
            $counterLines = $entry->lines->reject(fn (JournalLine $line) => $cashIds->contains($line->account_id));

            $net = $cashLines->reduce(
                fn (string $sum, JournalLine $line) => bcadd($sum, bcsub((string) $line->debit, (string) $line->credit, 2), 2),
                '0.00',
            );

            // Transfer antar kas: tidak ada uang yang masuk atau keluar usaha.
            if (bccomp($net, '0', 2) === 0 || $counterLines->isEmpty()) {
                continue;
            }

            $key = $this->classify($counterLines, bccomp($net, '0', 2) > 0);
            $amounts[$key] = bcadd($amounts[$key], $net, 2);
        }

        $activities = [];
        $netChange = '0.00';

        foreach (self::LINES as $activity => $lines) {
            $rows = [];
            $subtotal = '0.00';
            foreach ($lines as $key => $label) {
                $rows[] = ['key' => $key, 'label' => $label, 'amount' => $amounts[$key]];
                $subtotal = bcadd($subtotal, $amounts[$key], 2);
            }
            $activities[] = ['key' => $activity, 'title' => self::TITLES[$activity], 'rows' => $rows, 'total' => $subtotal];
            $netChange = bcadd($netChange, $subtotal, 2);
        }

        $closing = bcadd($opening, $netChange, 2);

        return [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'activities' => $activities,
            'summary' => [
                'opening_balance' => $opening,
                'net_operating' => $activities[0]['total'],
                'net_investing' => $activities[1]['total'],
                'net_financing' => $activities[2]['total'],
                'net_change' => $netChange,
                'closing_balance' => $closing,
                // Saldo kas menurut jurnal per tanggal akhir; harus sama dengan `closing_balance`.
                'ledger_cash' => $this->cashBalance($cashIds, null, $to),
            ],
        ];
    }

    /** @param  Collection<int, JournalLine>  $counterLines */
    private function classify($counterLines, bool $isInflow): string
    {
        $groups = $counterLines->map(fn (JournalLine $line) => $line->account->category->group);
        $categories = $counterLines->map(fn (JournalLine $line) => $line->account->category->name);

        if ($groups->contains(AccountGroup::AsetTidakLancar)) {
            return $isInflow ? 'asset_sales' : 'asset_purchases';
        }

        if ($groups->contains(AccountGroup::Ekuitas)) {
            return $isInflow ? 'capital_in' : 'dividends';
        }

        if ($categories->contains('Kewajiban Jangka Panjang')) {
            return $isInflow ? 'loan_in' : 'loan_out';
        }

        if (! $isInflow) {
            return 'operating_payments';
        }

        $fromCustomers = $groups->contains(AccountGroup::Pendapatan)
            || $categories->contains('Piutang Usaha')
            || $counterLines->contains(fn (JournalLine $line) => str_contains($line->account->name, 'Diterima Dimuka'));

        return $fromCustomers ? 'customer_receipts' : 'other_receipts';
    }

    /** @param  Collection<int, int>  $cashIds */
    private function cashBalance($cashIds, ?CarbonInterface $from, CarbonInterface $to): string
    {
        $sum = JournalLine::query()
            ->whereHas('entry')
            ->whereIn('account_id', $cashIds)
            ->when($from !== null, fn ($q) => $q->whereDate('date', '>=', $from))
            ->whereDate('date', '<=', $to)
            ->selectRaw('COALESCE(SUM(debit), 0) as debit, COALESCE(SUM(credit), 0) as credit')
            ->first();

        return bcsub((string) $sum->debit, (string) $sum->credit, 2);
    }
}
