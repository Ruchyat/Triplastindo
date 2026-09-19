<?php

namespace App\Services\Reports;

use App\Enums\AccountGroup;
use App\Models\Account;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Laporan Neraca per tanggal tertentu, mengikuti tab LAPORAN NERACA di sheet:
 *
 *   ASET LANCAR · ASET TETAP · DEPRESIASI & AMORTISASI  = Total Aset
 *   LIABILITAS · EKUITAS                                 = Total Liabilitas & Ekuitas
 *
 * Laba yang belum ditutup ke ekuitas disajikan sebagai dua baris hitungan di
 * bagian Ekuitas — laba ditahan periode lalu dan laba tahun berjalan — supaya
 * neraca tetap seimbang meski tutup buku belum dijalankan.
 */
final class BalanceSheetReport
{
    private const SECTIONS = [
        ['group' => AccountGroup::AsetLancar, 'key' => 'current_assets', 'title' => 'ASET LANCAR', 'side' => 'assets'],
        ['group' => AccountGroup::AsetTidakLancar, 'key' => 'fixed_assets', 'title' => 'ASET TETAP', 'side' => 'assets'],
        ['group' => AccountGroup::KontraAset, 'key' => 'accumulated_depreciation', 'title' => 'DEPRESIASI & AMORTISASI', 'side' => 'assets'],
        ['group' => AccountGroup::Liabilitas, 'key' => 'liabilities', 'title' => 'LIABILITAS', 'side' => 'liabilities'],
        ['group' => AccountGroup::Ekuitas, 'key' => 'equity', 'title' => 'EKUITAS', 'side' => 'equity'],
    ];

    public function __construct(
        private readonly AccountBalances $balances = new AccountBalances,
        private readonly ProfitLossReport $profitLoss = new ProfitLossReport,
    ) {}

    /** @return array<string, mixed> */
    public function build(CarbonInterface $asOf): array
    {
        // Sisi aset dibaca debit − kredit, sisi liabilitas/ekuitas kredit −
        // debit; akun kontra (Dividen, Cadangan Kerugian Piutang) otomatis
        // mengurangi kelompoknya. Akumulasi penyusutan dibaca dari sisi kredit
        // dan dikurangkan dari aset.
        $netDebit = $this->balances->netDebit(null, $asOf);
        $balances = $netDebit->map(fn (string $net) => $net);
        $accounts = $this->balanceAccounts($balances);
        $amountOf = fn (Account $account, string $side): string => $side === 'assets'
            ? $netDebit->get($account->id, '0.00')
            : bcmul($netDebit->get($account->id, '0.00'), '-1', 2);

        $sections = [];
        $totals = [];

        foreach (self::SECTIONS as $section) {
            $rows = $accounts
                ->filter(fn (Account $account) => $account->category->group === $section['group'])
                ->map(fn (Account $account) => [
                    'account_id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'category' => $account->category->name,
                    'amount' => $amountOf($account, $section['group'] === AccountGroup::KontraAset ? 'liabilities' : $section['side']),
                ])
                ->values();

            $total = $rows->reduce(fn (string $sum, array $row) => bcadd($sum, $row['amount'], 2), '0.00');
            $totals[$section['key']] = $total;

            $sections[] = [
                'key' => $section['key'],
                'title' => $section['title'],
                'side' => $section['side'],
                'rows' => $rows->all(),
                'total' => $total,
            ];
        }

        // Laba yang belum ditutup: tahun berjalan dihitung sejak 1 Januari,
        // periode lalu adalah seluruh laba sebelum itu.
        $yearStart = $asOf->copy()->startOfYear();
        $currentEarnings = $this->profitLoss->build($yearStart, $asOf)['results']['net_profit'];
        $priorEarnings = $this->profitLoss->build(null, $yearStart->copy()->subDay()->endOfDay())['results']['net_profit'];

        // Akun kontra aset bersaldo normal kredit, jadi nilainya mengurangi aset.
        $totalAssets = bcsub(
            bcadd($totals['current_assets'], $totals['fixed_assets'], 2),
            $totals['accumulated_depreciation'],
            2,
        );
        $totalEquity = bcadd(bcadd($totals['equity'], $priorEarnings, 2), $currentEarnings, 2);
        $totalLiabilitiesEquity = bcadd($totals['liabilities'], $totalEquity, 2);

        $inventory = $accounts
            ->filter(fn (Account $a) => $a->category->group === AccountGroup::AsetLancar && $a->category->name === 'Persediaan')
            ->reduce(fn (string $sum, Account $a) => bcadd($sum, $amountOf($a, 'assets'), 2), '0.00');
        $currentLiabilities = $accounts
            ->filter(fn (Account $a) => $a->category->group === AccountGroup::Liabilitas && $a->category->name === 'Kewajiban Lancar')
            ->reduce(fn (string $sum, Account $a) => bcadd($sum, $amountOf($a, 'liabilities'), 2), '0.00');
        $cash = $accounts
            ->filter(fn (Account $a) => $a->is_cash)
            ->reduce(fn (string $sum, Account $a) => bcadd($sum, $amountOf($a, 'assets'), 2), '0.00');

        return [
            'as_of' => $asOf->toDateString(),
            'sections' => $sections,
            'earnings' => [
                'retained_prior' => $priorEarnings,
                'current_year' => $currentEarnings,
            ],
            'totals' => [
                'current_assets' => $totals['current_assets'],
                'fixed_assets' => $totals['fixed_assets'],
                'accumulated_depreciation' => $totals['accumulated_depreciation'],
                'total_assets' => $totalAssets,
                'liabilities' => $totals['liabilities'],
                'current_liabilities' => $currentLiabilities,
                'equity' => $totalEquity,
                'total_liabilities_equity' => $totalLiabilitiesEquity,
                'difference' => bcsub($totalAssets, $totalLiabilitiesEquity, 2),
                'inventory' => $inventory,
                'cash' => $cash,
            ],
        ];
    }

    /**
     * @param  Collection<int, string>  $balances
     * @return Collection<int, Account>
     */
    private function balanceAccounts(Collection $balances): Collection
    {
        $groups = array_map(fn (array $section) => $section['group']->value, self::SECTIONS);

        return Account::query()
            ->with('category')
            ->whereHas('category', fn ($q) => $q->whereIn('group', $groups))
            ->where(fn ($q) => $q->where('is_active', true)->orWhereIn('id', $balances->keys()))
            ->orderBy('code')
            ->get();
    }
}
