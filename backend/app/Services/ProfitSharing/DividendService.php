<?php

namespace App\Services\ProfitSharing;

use App\Enums\JournalSource;
use App\Models\DividendAllocation;
use App\Models\DividendDecision;
use App\Models\JournalEntry;
use App\Models\Setting;
use App\Models\Shareholder;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use App\Services\DocumentNumberGenerator;
use App\Services\Reports\CashFlowReport;
use App\Services\Reports\ProfitLossReport;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Pengajuan, persetujuan, dan pembatalan pembagian dividen.
 *
 * Check point mengikuti tab BAGI HASIL: saldo kas akhir periode dibandingkan
 * minimum cash dari pengaturan. Pengajuan tetap boleh disimpan meski tidak
 * aman — peringatannya ditampilkan, keputusannya milik Direksi.
 *
 * Saat disetujui, jurnalnya: D Dividen · K Hutang PPh Final · K Kas/Bank.
 */
final class DividendService
{
    private const PREFIX = 'DIV';

    public function __construct(
        private readonly JournalPoster $journals = new JournalPoster,
        private readonly DocumentNumberGenerator $numbers = new DocumentNumberGenerator,
        private readonly ProfitLossReport $profitLoss = new ProfitLossReport,
        private readonly CashFlowReport $cashFlow = new CashFlowReport,
    ) {}

    /** Angka pendukung satu bulan: saldo kas akhir, minimum, laba, dan statusnya. */
    public function checkpoint(int $year, int $month): array
    {
        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth();

        $cash = $this->cashFlow->build($start, $end)['summary']['closing_balance'];
        $profit = $this->profitLoss->build($start, $end)['results']['net_profit'];
        $ytdProfit = $this->profitLoss->build($start->copy()->startOfYear(), $end)['results']['net_profit'];
        $minimum = bcadd((string) Setting::get('parameters')['minimum_cash'], '0', 2);

        return [
            'year' => $year,
            'month' => $month,
            'cash_balance' => $cash,
            'minimum_cash' => $minimum,
            'is_safe' => bccomp($cash, $minimum, 2) >= 0,
            'net_profit' => $profit,
            'net_profit_ytd' => $ytdProfit,
        ];
    }

    /** @param  array<string, mixed>  $data */
    public function propose(array $data, User $user): DividendDecision
    {
        $shareholders = Shareholder::query()->where('is_active', true)->orderBy('name')->get();
        $totalShares = $shareholders->sum('shares');

        if ($totalShares <= 0) {
            throw ValidationException::withMessages(['shareholders' => 'Belum ada pemegang saham aktif dengan jumlah saham.']);
        }

        $checkpoint = $this->checkpoint((int) $data['year'], (int) $data['month']);
        $total = bcadd((string) $data['total_amount'], '0', 2);
        $taxRate = (string) ($data['tax_rate'] ?? Setting::get('parameters')['dividend_tax_rate']);
        $date = Carbon::parse($data['decision_date']);

        return DB::transaction(function () use ($data, $user, $shareholders, $totalShares, $checkpoint, $total, $taxRate, $date) {
            $decision = DividendDecision::query()->create([
                'number' => $this->numbers->next(self::PREFIX, $date, DividendDecision::class),
                'year' => $data['year'],
                'month' => $data['month'],
                'decision_date' => $date->toDateString(),
                'total_amount' => $total,
                'tax_rate' => $taxRate,
                'cash_account_id' => $data['cash_account_id'],
                'status' => 'draft',
                'cash_balance' => $checkpoint['cash_balance'],
                'minimum_cash' => $checkpoint['minimum_cash'],
                'net_profit' => $checkpoint['net_profit'],
                'proposed_by' => $user->id,
                'note' => $data['note'] ?? null,
            ]);

            $allocatedGross = '0.00';
            $rows = [];
            foreach ($shareholders as $index => $shareholder) {
                $percentage = bcdiv((string) $shareholder->shares, (string) $totalShares, 6);
                // Pemegang saham terakhir menerima sisanya agar pembulatan tidak menyisakan selisih.
                $gross = $index === $shareholders->count() - 1
                    ? bcsub($total, $allocatedGross, 2)
                    : bcmul($total, $percentage, 2);
                $allocatedGross = bcadd($allocatedGross, $gross, 2);
                $tax = bcmul($gross, $taxRate, 2);
                $rows[] = [
                    'shareholder_id' => $shareholder->id,
                    'shares' => $shareholder->shares,
                    'percentage' => $percentage,
                    'gross' => $gross,
                    'tax' => $tax,
                    'net' => bcsub($gross, $tax, 2),
                ];
            }
            foreach ($rows as $row) {
                $decision->allocations()->create($row);
            }

            return $decision;
        });
    }

    public function approve(DividendDecision $decision, User $user): DividendDecision
    {
        if ($decision->status !== 'draft') {
            throw ValidationException::withMessages(['status' => 'Pengajuan ini sudah diputuskan.']);
        }

        $decision->loadMissing('allocations', 'cashAccount');
        $tax = $decision->allocations->reduce(fn (string $s, DividendAllocation $a) => bcadd($s, (string) $a->tax, 2), '0.00');
        $net = bcsub((string) $decision->total_amount, $tax, 2);
        $accounts = config('triplastindo.accounts');
        $period = Carbon::create($decision->year, $decision->month, 1)->translatedFormat('F Y');

        return DB::transaction(function () use ($decision, $user, $tax, $net, $accounts, $period) {
            $credits = [];
            if (bccomp($tax, '0', 2) > 0) {
                $credits[] = JournalLineDraft::credit($accounts['dividend_tax_payable'], $tax, "PPh final dividen {$period}");
            }
            $credits[] = JournalLineDraft::credit($decision->cashAccount->code, $net, "Pembayaran dividen {$period}");

            $entry = $this->journals->post(new JournalDraft(
                date: $decision->decision_date,
                description: "Dividen {$decision->number} · {$period}",
                lines: [JournalLineDraft::debit($accounts['dividend'], (string) $decision->total_amount, "Dividen {$period}"), ...$credits],
                createdBy: $user->id,
                source: JournalSource::ProfitDistribution,
                sourceId: $decision->id,
                sourceNumber: $decision->number,
                paymentMethod: $decision->cashAccount->name,
            ));

            $decision->forceFill(['status' => 'approved', 'approved_by' => $user->id, 'approved_at' => now(), 'journal_entry_id' => $entry->id])->save();

            return $decision->refresh();
        });
    }

    public function cancel(DividendDecision $decision, User $user): DividendDecision
    {
        if ($decision->status === 'cancelled') {
            throw ValidationException::withMessages(['status' => 'Pengajuan ini sudah dibatalkan.']);
        }

        return DB::transaction(function () use ($decision, $user) {
            if ($decision->journal_entry_id) {
                $original = JournalEntry::query()->with('lines.account')->findOrFail($decision->journal_entry_id);
                $debits = [];
                $credits = [];
                foreach ($original->lines as $line) {
                    if ($line->isDebit()) {
                        $credits[] = JournalLineDraft::credit($line->account->code, $line->amount(), $line->description);
                    } else {
                        $debits[] = JournalLineDraft::debit($line->account->code, $line->amount(), $line->description);
                    }
                }
                $this->journals->post(new JournalDraft(
                    date: $decision->decision_date,
                    description: "Pembatalan {$decision->number}",
                    lines: [...$debits, ...$credits],
                    createdBy: $user->id,
                    source: JournalSource::ProfitDistribution,
                    sourceId: $decision->id,
                    sourceNumber: $decision->number,
                ));
            }

            $decision->forceFill(['status' => 'cancelled'])->save();

            return $decision->refresh();
        });
    }
}
