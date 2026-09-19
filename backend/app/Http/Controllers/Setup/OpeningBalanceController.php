<?php

namespace App\Http\Controllers\Setup;

use App\Enums\JournalSource;
use App\Http\Controllers\Controller;
use App\Http\Resources\JournalEntryResource;
use App\Models\JournalEntry;
use App\Services\Setup\OpeningBalancePoster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/** Input saldo awal neraca. Jurnalnya biasa dan dapat dihapus lewat Jurnal Umum bila salah. */
class OpeningBalanceController extends Controller
{
    public function __construct(private readonly OpeningBalancePoster $poster) {}

    public function index(): AnonymousResourceCollection
    {
        return JournalEntryResource::collection(
            JournalEntry::query()
                ->where('source', JournalSource::OpeningBalance)
                ->with(['lines.account.category', 'creator'])
                ->orderBy('date')
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.account_code' => ['required', 'string', 'distinct', Rule::exists('accounts', 'code')],
            'rows.*.amount' => ['required', 'numeric'],
        ]);

        $entry = $this->poster->post(Carbon::parse($data['date']), $data['rows'], $request->user());

        return (new JournalEntryResource($entry->load(['lines.account.category', 'creator'])))
            ->response()
            ->setStatusCode(201);
    }
}
