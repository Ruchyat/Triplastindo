<?php

namespace App\Services\Reports;

use App\Enums\AccountGroup;
use App\Models\Account;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Laporan Laba Rugi, mengikuti susunan tab LAPORAN LABA RUGI di Google Sheet:
 *
 *   Pendapatan
 *   − HPP Produksi          = Laba Kotor
 *   − Beban Operasional     = Laba Operasional
 *   + Pendapatan Lain − Beban Lain
 *                           = Laba Sebelum Pajak
 *   − Pajak                 = Laba Bersih
 *
 * Setiap akun pada kelompok Laba Rugi ditampilkan meski nol, sama seperti di
 * sheet, supaya pembaca melihat akun mana yang belum pernah bergerak. Akun
 * kontra (Retur dan Potongan Penjualan) tampil negatif di kelompoknya.
 */
final class ProfitLossReport
{
    /** Kelompok dan judul bagiannya, urut seperti di laporan. */
    private const SECTIONS = [
        ['group' => AccountGroup::Pendapatan, 'key' => 'revenue', 'title' => 'PENDAPATAN', 'side' => 'credit'],
        ['group' => AccountGroup::Hpp, 'key' => 'cogs', 'title' => 'HPP PRODUKSI', 'side' => 'debit'],
        ['group' => AccountGroup::Beban, 'key' => 'operating_expenses', 'title' => 'BEBAN OPERASIONAL', 'side' => 'debit'],
        ['group' => AccountGroup::PendapatanLain, 'key' => 'other_income', 'title' => 'PENDAPATAN LAIN-LAIN', 'side' => 'credit'],
        ['group' => AccountGroup::BebanLain, 'key' => 'other_expenses', 'title' => 'BEBAN LAIN-LAIN', 'side' => 'debit'],
        ['group' => AccountGroup::Pajak, 'key' => 'tax', 'title' => 'PAJAK', 'side' => 'debit'],
    ];

    public function __construct(private readonly AccountBalances $balances = new AccountBalances) {}

    /** @return array<string, mixed> */
    /** `$from` kosong berarti sejak jurnal pertama — dipakai Neraca untuk laba ditahan. */
    public function build(?CarbonInterface $from, CarbonInterface $to): array
    {
        // Kelompok pendapatan dibaca dari sisi kredit, kelompok beban dari sisi
        // debit — akun kontra seperti Retur Penjualan otomatis bernilai negatif.
        $netDebit = $this->balances->netDebit($from, $to);
        $accounts = $this->profitLossAccounts($netDebit);

        $sections = [];
        $totals = [];

        foreach (self::SECTIONS as $section) {
            $rows = $accounts
                ->filter(fn (Account $account) => $account->category->group === $section['group'])
                ->map(fn (Account $account) => [
                    'account_id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'amount' => $section['side'] === 'credit'
                        ? bcmul($netDebit->get($account->id, '0.00'), '-1', 2)
                        : $netDebit->get($account->id, '0.00'),
                ])
                ->values();

            $total = $rows->reduce(fn (string $sum, array $row) => bcadd($sum, $row['amount'], 2), '0.00');
            $totals[$section['key']] = $total;

            $sections[] = [
                'key' => $section['key'],
                'title' => $section['title'],
                'rows' => $rows->all(),
                'total' => $total,
            ];
        }

        $grossProfit = bcsub($totals['revenue'], $totals['cogs'], 2);
        $operatingProfit = bcsub($grossProfit, $totals['operating_expenses'], 2);
        $other = bcsub($totals['other_income'], $totals['other_expenses'], 2);
        $beforeTax = bcadd($operatingProfit, $other, 2);
        $netProfit = bcsub($beforeTax, $totals['tax'], 2);

        return [
            'from' => $from?->toDateString(),
            'to' => $to->toDateString(),
            'sections' => $sections,
            'results' => [
                'revenue' => $totals['revenue'],
                'gross_profit' => $grossProfit,
                'operating_profit' => $operatingProfit,
                'other_income_expense' => $other,
                'profit_before_tax' => $beforeTax,
                'tax' => $totals['tax'],
                'net_profit' => $netProfit,
                'total_expenses' => bcsub($totals['revenue'], $netProfit, 2),
            ],
        ];
    }

    /**
     * Akun Laba Rugi yang ditampilkan: seluruh akun aktif pada kelompok itu,
     * ditambah akun nonaktif yang masih punya saldo pada periode ini.
     *
     * @param  Collection<int, string>  $balances
     * @return Collection<int, Account>
     */
    private function profitLossAccounts(Collection $balances): Collection
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
