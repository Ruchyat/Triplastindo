<?php

namespace App\Services\Assets;

use App\Enums\JournalSource;
use App\Models\AssetDepreciation;
use App\Models\FixedAsset;
use App\Models\JournalEntry;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Menjalankan dan membatalkan penyusutan satu bulan.
 *
 * Satu jurnal per jenis aset (D beban penyusutan · K akumulasi), satu baris
 * `asset_depreciations` per aset. Aset yang sudah habis disusutkan sampai
 * nilai residunya tidak disusutkan lagi; bulan terakhir memakai sisanya agar
 * akumulasi berhenti tepat di nominal − residu.
 */
final class DepreciationRunner
{
    public function __construct(private readonly JournalPoster $journals = new JournalPoster) {}

    /** @return array{count: int, total: string, journal_ids: list<int>} */
    public function run(int $year, int $month, User $user): array
    {
        $periodEnd = Carbon::create($year, $month, 1)->endOfMonth();

        if (AssetDepreciation::query()->where('year', $year)->where('month', $month)->exists()) {
            throw ValidationException::withMessages([
                'month' => "Penyusutan {$periodEnd->translatedFormat('F Y')} sudah pernah dijalankan.",
            ]);
        }

        $assets = FixedAsset::query()
            ->with('type.accumulatedAccount', 'type.expenseAccount')
            ->where('status', 'active')
            ->whereDate('in_use_date', '<=', $periodEnd)
            ->whereHas('type', fn ($q) => $q->where('is_depreciable', true))
            ->orderBy('code')
            ->get();

        return DB::transaction(function () use ($assets, $year, $month, $periodEnd, $user) {
            $perType = [];
            $rows = [];

            foreach ($assets as $asset) {
                $amount = $asset->monthlyDepreciation();
                $remaining = $asset->remainingDepreciable();

                if (bccomp($remaining, '0', 2) <= 0) {
                    continue;
                }
                if (bccomp($amount, $remaining, 2) > 0) {
                    $amount = $remaining;
                }
                if (bccomp($amount, '0', 2) <= 0) {
                    continue;
                }

                $perType[$asset->asset_type_id]['type'] = $asset->type;
                $perType[$asset->asset_type_id]['total'] = bcadd($perType[$asset->asset_type_id]['total'] ?? '0.00', $amount, 2);
                $rows[] = ['asset' => $asset, 'amount' => $amount];
            }

            $journals = [];
            foreach ($perType as $typeId => $bucket) {
                $type = $bucket['type'];
                $journals[$typeId] = $this->journals->post(new JournalDraft(
                    date: $periodEnd,
                    description: "Penyusutan {$type->name} · ".$periodEnd->translatedFormat('F Y'),
                    lines: [
                        JournalLineDraft::debit($type->expenseAccount->code, $bucket['total'], "Penyusutan {$type->name}"),
                        JournalLineDraft::credit($type->accumulatedAccount->code, $bucket['total'], "Akumulasi {$type->name}"),
                    ],
                    createdBy: $user->id,
                    source: JournalSource::Depreciation,
                ));
            }

            $total = '0.00';
            foreach ($rows as $row) {
                AssetDepreciation::query()->create([
                    'fixed_asset_id' => $row['asset']->id,
                    'year' => $year,
                    'month' => $month,
                    'amount' => $row['amount'],
                    'journal_entry_id' => $journals[$row['asset']->asset_type_id]->id,
                ]);
                $total = bcadd($total, $row['amount'], 2);
            }

            return [
                'count' => count($rows),
                'total' => $total,
                'journal_ids' => array_values(array_map(fn (JournalEntry $e) => $e->id, $journals)),
            ];
        });
    }

    /** Membatalkan penyusutan satu bulan: barisnya dihapus, jurnalnya dibalik. */
    public function undo(int $year, int $month, User $user): void
    {
        $rows = AssetDepreciation::query()->where('year', $year)->where('month', $month)->get();

        if ($rows->isEmpty()) {
            throw ValidationException::withMessages(['month' => 'Belum ada penyusutan pada bulan itu.']);
        }

        $later = AssetDepreciation::query()
            ->where(fn ($q) => $q->where('year', '>', $year)->orWhere(fn ($q2) => $q2->where('year', $year)->where('month', '>', $month)))
            ->exists();

        if ($later) {
            throw ValidationException::withMessages(['month' => 'Batalkan bulan-bulan sesudahnya terlebih dahulu.']);
        }

        DB::transaction(function () use ($rows, $user) {
            foreach ($rows->pluck('journal_entry_id')->unique()->filter() as $journalId) {
                $entry = JournalEntry::query()->with('lines.account')->findOrFail($journalId);
                $lines = [];
                foreach ($entry->lines as $line) {
                    $lines[] = $line->isDebit()
                        ? JournalLineDraft::credit($line->account->code, $line->amount(), $line->description)
                        : JournalLineDraft::debit($line->account->code, $line->amount(), $line->description);
                }
                usort($lines, fn ($a, $b) => (int) $b->isDebit <=> (int) $a->isDebit);

                $this->journals->post(new JournalDraft(
                    date: $entry->date,
                    description: "Pembatalan {$entry->number} · {$entry->description}",
                    lines: $lines,
                    createdBy: $user->id,
                    source: JournalSource::Depreciation,
                ));
            }

            AssetDepreciation::query()->whereIn('id', $rows->pluck('id'))->delete();
        });
    }
}
