<?php

namespace App\Services\Reports;

use App\Enums\NormalBalance;
use App\Models\Account;
use App\Models\JournalLine;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Saldo per akun untuk sebuah rentang tanggal, dihitung dari baris jurnal.
 *
 * Semua laporan berangkat dari sini: Laba Rugi memakai rentang periode, Neraca
 * memakai "sejak awal sampai tanggal tertentu". Jurnal yang dihapus tidak ikut
 * — barisnya hanya dibaca lewat kepala jurnal yang masih ada.
 */
final class AccountBalances
{
    /** @var Collection<int, Account> akun yang muncul pada kueri terakhir */
    private Collection $accounts;

    /**
     * Saldo tiap akun, terindeks id akun, searah saldo normalnya.
     *
     * @return Collection<int, string>
     */
    public function between(?CarbonInterface $from, CarbonInterface $to): Collection
    {
        return $this->netDebit($from, $to)->map(function (string $net, int $accountId) {
            $account = $this->accounts->get($accountId);

            return $account?->normal_balance === NormalBalance::Kredit ? bcmul($net, '-1', 2) : $net;
        });
    }

    /**
     * Saldo bersih sisi debit (debit − kredit) tiap akun, terindeks id akun.
     *
     * Laporan memakainya untuk menempatkan akun kontra pada tandanya yang
     * benar: Dividen mengurangi ekuitas, Retur mengurangi pendapatan, Cadangan
     * Kerugian Piutang mengurangi aset — apa pun saldo normal masing-masing.
     *
     * @return Collection<int, string>
     */
    public function netDebit(?CarbonInterface $from, CarbonInterface $to): Collection
    {
        $sums = JournalLine::query()
            ->whereHas('entry')
            ->when($from !== null, fn (Builder $q) => $q->whereDate('date', '>=', $from))
            ->whereDate('date', '<=', $to)
            ->selectRaw('account_id, SUM(debit) as debit, SUM(credit) as credit')
            ->groupBy('account_id')
            ->get()
            ->keyBy('account_id');

        $this->accounts = Account::query()->whereIn('id', $sums->keys())->get()->keyBy('id');

        return $sums->map(fn (object $sum) => bcsub((string) $sum->debit, (string) $sum->credit, 2));
    }

    /**
     * Sisi kredit (kredit − debit), untuk kelompok liabilitas, ekuitas, dan pendapatan.
     *
     * @return Collection<int, string>
     */
    public function netCredit(?CarbonInterface $from, CarbonInterface $to): Collection
    {
        return $this->netDebit($from, $to)->map(fn (string $net) => bcmul($net, '-1', 2));
    }

    /** Saldo kumulatif sampai akhir tanggal tertentu, searah saldo normal. */
    public function asOf(CarbonInterface $date): Collection
    {
        return $this->between(null, $date);
    }
}
