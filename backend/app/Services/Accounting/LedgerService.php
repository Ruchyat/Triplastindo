<?php

namespace App\Services\Accounting;

use App\Models\Account;
use App\Models\JournalLine;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Buku Besar dan Neraca Saldo, dihitung langsung dari baris jurnal.
 *
 * Tidak ada tabel saldo yang disimpan terpisah: saldo selalu dijumlahkan dari
 * jurnalnya, sehingga tidak mungkin berbeda dengan Jurnal Umum. Jurnal yang
 * dihapus (soft delete) tidak ikut dihitung, karena barisnya hanya dibaca
 * lewat kepala jurnal yang masih ada.
 */
final class LedgerService
{
    /**
     * Saldo awal, mutasi, dan saldo akhir setiap akun dalam satu rentang.
     *
     * Akun tanpa pergerakan sama sekali — sebelum maupun selama rentang —
     * tidak disertakan, agar neraca saldo tidak dipenuhi baris nol.
     *
     * @return list<array<string, mixed>>
     */
    public function trialBalance(CarbonInterface $from, CarbonInterface $to): array
    {
        $opening = $this->sumsByAccount(fn (Builder $q) => $q->whereDate('date', '<', $from));
        $period = $this->sumsByAccount(fn (Builder $q) => $q->whereBetween('date', [$from->toDateString(), $to->toDateString()]));

        $accountIds = $opening->keys()->merge($period->keys())->unique();

        return Account::query()
            ->with('category')
            ->whereIn('id', $accountIds)
            ->orderBy('code')
            ->get()
            ->map(function (Account $account) use ($opening, $period) {
                $open = $opening->get($account->id);
                $move = $period->get($account->id);

                $openingBalance = $account->normal_balance->balanceOf($open->debit ?? '0', $open->credit ?? '0');
                $debit = $move->debit ?? '0.00';
                $credit = $move->credit ?? '0.00';

                return [
                    'account' => $account,
                    'opening_balance' => $this->money($openingBalance),
                    'debit' => $this->money($debit),
                    'credit' => $this->money($credit),
                    'closing_balance' => $this->money(bcadd(
                        $openingBalance,
                        $account->normal_balance->balanceOf($debit, $credit),
                        2,
                    )),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Mutasi satu akun beserta saldo berjalannya.
     *
     * @return array{opening_balance: string, total_debit: string, total_credit: string, closing_balance: string, lines: list<array<string, mixed>>}
     */
    public function accountLedger(Account $account, CarbonInterface $from, CarbonInterface $to): array
    {
        $before = $this->linesOf($account)
            ->whereDate('date', '<', $from)
            ->selectRaw('COALESCE(SUM(debit), 0) as debit, COALESCE(SUM(credit), 0) as credit')
            ->first();

        $opening = $account->normal_balance->balanceOf((string) $before->debit, (string) $before->credit);

        $lines = $this->linesOf($account)
            ->with('entry')
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('date')
            ->orderBy('journal_entry_id')
            ->orderBy('sort_order')
            ->get();

        $balance = $opening;
        $totalDebit = '0.00';
        $totalCredit = '0.00';
        $rows = [];

        foreach ($lines as $line) {
            $debit = (string) $line->debit;
            $credit = (string) $line->credit;
            $balance = bcadd($balance, $account->normal_balance->balanceOf($debit, $credit), 2);
            $totalDebit = bcadd($totalDebit, $debit, 2);
            $totalCredit = bcadd($totalCredit, $credit, 2);

            $rows[] = [
                'id' => $line->id,
                'date' => $line->date->toDateString(),
                'journal_entry_id' => $line->journal_entry_id,
                'journal_number' => $line->entry?->number,
                'source_label' => $line->entry?->source->label(),
                'source_number' => $line->entry?->source_number,
                'description' => $line->description ?: $line->entry?->description,
                'debit' => $this->money($debit),
                'credit' => $this->money($credit),
                'balance' => $this->money($balance),
            ];
        }

        return [
            'opening_balance' => $this->money($opening),
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'closing_balance' => $this->money($balance),
            'lines' => $rows,
        ];
    }

    /** @return Builder<JournalLine> */
    private function linesOf(Account $account): Builder
    {
        return JournalLine::query()
            ->where('account_id', $account->id)
            ->whereHas('entry');
    }

    /**
     * Total debit dan kredit per akun, terindeks id akun.
     *
     * @param  callable(Builder<JournalLine>): void  $scope
     * @return Collection<int, object{debit: string, credit: string}>
     */
    private function sumsByAccount(callable $scope): Collection
    {
        $query = JournalLine::query()
            ->whereHas('entry')
            ->selectRaw('account_id, SUM(debit) as debit, SUM(credit) as credit')
            ->groupBy('account_id');

        $scope($query);

        return $query->get()->keyBy('account_id');
    }

    private function money(string|int|float|null $value): string
    {
        return bcadd((string) ($value ?? 0), '0', 2);
    }
}
