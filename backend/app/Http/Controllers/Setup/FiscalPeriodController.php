<?php

namespace App\Http\Controllers\Setup;

use App\Enums\PeriodStatus;
use App\Http\Controllers\Controller;
use App\Models\FiscalPeriod;
use App\Models\JournalEntry;
use App\Services\Accounting\ClosedPeriodRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Tutup dan buka buku bulanan.
 *
 * Bulan yang ditutup menolak jurnal baru dari modul mana pun — JournalPoster
 * memeriksanya. Menutup harus berurutan: bulan sebelumnya harus sudah ditutup
 * lebih dahulu, dan membuka kembali hanya boleh pada bulan tertutup terakhir.
 */
class FiscalPeriodController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $year = $request->integer('year') ?: now()->year;
        $closed = FiscalPeriod::query()->where('year', $year)->with('closedBy')->get()->keyBy('month');
        // Dihitung di PHP agar tidak bergantung fungsi tanggal tiap database.
        $counts = JournalEntry::query()
            ->whereYear('date', $year)
            ->pluck('date')
            ->countBy(fn ($date) => (int) $date->format('n'));

        $months = collect(range(1, 12))->map(function (int $month) use ($closed, $counts, $year) {
            $period = $closed->get($month);

            return [
                'year' => $year,
                'month' => $month,
                'status' => $period?->status->value ?? PeriodStatus::Open->value,
                'journal_count' => (int) ($counts[$month] ?? 0),
                'closed_by' => $period?->closedBy?->name,
                'closed_at' => $period?->closed_at?->toIso8601String(),
            ];
        });

        return response()->json(['data' => $months->values()]);
    }

    public function close(Request $request): JsonResponse
    {
        [$year, $month] = $this->period($request);
        $previous = now()->setDate($year, $month, 1)->subMonth();

        $previousHasJournals = JournalEntry::query()
            ->whereYear('date', $previous->year)->whereMonth('date', $previous->month)->exists();

        if ($previousHasJournals && ! FiscalPeriod::isClosedOn($previous)) {
            throw ValidationException::withMessages([
                'month' => "Tutup {$previous->translatedFormat('F Y')} terlebih dahulu; tutup buku harus berurutan.",
            ]);
        }

        FiscalPeriod::query()->updateOrCreate(
            ['year' => $year, 'month' => $month],
            ['status' => PeriodStatus::Closed, 'closed_by' => $request->user()->id, 'closed_at' => now()],
        );
        app(ClosedPeriodRegistry::class)->forget();

        return $this->index($request->merge(['year' => $year]));
    }

    public function reopen(Request $request): JsonResponse
    {
        [$year, $month] = $this->period($request);
        $next = now()->setDate($year, $month, 1)->addMonth();

        if (FiscalPeriod::isClosedOn($next)) {
            throw ValidationException::withMessages([
                'month' => "Buka {$next->translatedFormat('F Y')} terlebih dahulu; hanya bulan tertutup terakhir yang dapat dibuka.",
            ]);
        }

        FiscalPeriod::query()->where('year', $year)->where('month', $month)->delete();
        app(ClosedPeriodRegistry::class)->forget();

        return $this->index($request->merge(['year' => $year]));
    }

    /** @return array{0: int, 1: int} */
    private function period(Request $request): array
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        return [(int) $data['year'], (int) $data['month']];
    }
}
