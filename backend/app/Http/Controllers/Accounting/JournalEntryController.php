<?php

namespace App\Http\Controllers\Accounting;

use App\Enums\JournalSource;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounting\StoreJournalEntryRequest;
use App\Http\Resources\JournalEntryResource;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Jurnal Umum.
 *
 * Endpoint pembuatan di sini hanya melayani Jurnal Manual. Jurnal yang lahir
 * dari dokumen dibuat oleh modulnya masing-masing, dan diperbaiki dengan
 * mengubah dokumen asalnya.
 */
class JournalEntryController extends Controller
{
    public function __construct(private readonly JournalPoster $poster) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $entries = JournalEntry::query()
            ->with(['lines.account.category', 'creator'])
            ->tap(fn ($query) => $this->applyFilters($query, $request))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(min($request->integer('per_page', 25), 100))
            ->withQueryString();

        return JournalEntryResource::collection($entries);
    }

    /**
     * Total debit dan kredit untuk filter yang sedang dipakai.
     *
     * Dihitung backend agar mencakup seluruh jurnal, bukan hanya halaman yang
     * sedang tampil. `unbalanced` seharusnya selalu nol — JournalPoster tidak
     * mengizinkan jurnal tidak seimbang tersimpan — tetapi tetap ditampilkan
     * sebagai pemeriksaan mandiri: angka selain nol berarti ada yang menulis
     * ke tabel jurnal tanpa melewati poster.
     */
    public function summary(Request $request): JsonResponse
    {
        $lines = JournalLine::query()
            ->whereHas('entry', fn ($entry) => $this->applyFilters($entry, $request));

        $unbalanced = JournalEntry::query()
            ->select('journal_entries.id')
            ->join('journal_lines', 'journal_lines.journal_entry_id', '=', 'journal_entries.id')
            ->groupBy('journal_entries.id')
            ->havingRaw('ROUND(SUM(journal_lines.debit) - SUM(journal_lines.credit), 2) <> 0')
            ->count();

        return response()->json([
            'data' => [
                'total_debit' => $this->money($lines->clone()->sum('debit')),
                'total_credit' => $this->money($lines->clone()->sum('credit')),
                'total_entries' => JournalEntry::query()->tap(fn ($query) => $this->applyFilters($query, $request))->count(),
                'unbalanced_count' => $unbalanced,
            ],
        ]);
    }

    public function show(JournalEntry $journalEntry): JournalEntryResource
    {
        return new JournalEntryResource($journalEntry->load(['lines.account.category', 'creator']));
    }

    public function store(StoreJournalEntryRequest $request): JsonResponse
    {
        $input = $request->validated();

        $entry = $this->poster->post(new JournalDraft(
            date: Carbon::parse($input['date']),
            description: $input['description'],
            lines: array_map($this->toLineDraft(...), $input['lines']),
            createdBy: $request->user()->id,
            source: JournalSource::Manual,
            paymentMethod: $input['payment_method'] ?? null,
        ));

        return (new JournalEntryResource($entry->load(['lines.account.category', 'creator'])))
            ->response()
            ->setStatusCode(201);
    }

    /** Menghapus jurnal manual. Jejaknya tetap tersimpan sebagai soft delete. */
    public function destroy(JournalEntry $journalEntry): JsonResponse
    {
        if (! $journalEntry->isEditable()) {
            throw new AccessDeniedHttpException(
                $journalEntry->source->isManual()
                    ? "Jurnal {$journalEntry->number} berada pada periode yang sudah ditutup."
                    : "Jurnal {$journalEntry->number} berasal dari {$journalEntry->source->label()}. Ubah dokumen asalnya."
            );
        }

        $journalEntry->delete();

        return response()->json(['message' => "Jurnal {$journalEntry->number} dihapus."]);
    }

    /**
     * Penyaring yang sama dipakai daftar maupun ringkasan.
     *
     * Ditulis satu kali supaya angka ringkasan tidak pernah menghitung jurnal
     * yang berbeda dari yang sedang ditampilkan.
     *
     * @param  Builder<JournalEntry>  $query
     */
    private function applyFilters(Builder $query, Request $request): void
    {
        $query
            ->when($request->filled('from') && $request->filled('to'), fn ($q) => $q->whereBetween('date', [
                $request->string('from')->toString(),
                $request->string('to')->toString(),
            ]))
            ->when($request->filled('tagging'), fn ($q) => $q->where('tagging', $request->string('tagging')->toString()))
            ->when($request->filled('source'), fn ($q) => $q->where('source', $request->string('source')->toString()))
            ->when($request->filled('account_id'), fn ($q) => $q->whereHas(
                'lines',
                fn ($line) => $line->where('account_id', $request->integer('account_id')),
            ))
            ->when($request->filled('search'), fn ($q) => $q->where(
                fn ($inner) => $inner->where('number', 'like', '%'.$request->string('search')->toString().'%')
                    ->orWhere('description', 'like', '%'.$request->string('search')->toString().'%'),
            ));
    }

    /**
     * Satu baris permintaan menjadi satu baris draft.
     *
     * Baris yang mengisi kedua sisi sekaligus diperlakukan sebagai debit;
     * JournalPoster yang memastikan totalnya tetap seimbang.
     *
     * @param  array<string, mixed>  $line
     */
    private function toLineDraft(array $line): JournalLineDraft
    {
        $debit = (string) ($line['debit'] ?? 0);

        return bccomp($debit, '0', 2) > 0
            ? JournalLineDraft::debit($line['account_code'], $debit, $line['description'] ?? null)
            : JournalLineDraft::credit($line['account_code'], (string) ($line['credit'] ?? 0), $line['description'] ?? null);
    }
}
