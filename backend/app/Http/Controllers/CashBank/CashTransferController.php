<?php

namespace App\Http\Controllers\CashBank;

use App\Exceptions\CashTransferException;
use App\Http\Controllers\Controller;
use App\Http\Requests\CashBank\StoreCashTransferRequest;
use App\Http\Resources\CashTransferResource;
use App\Models\CashTransfer;
use App\Services\CashBank\CashTransferData;
use App\Services\CashBank\CashTransferPoster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Transfer antar akun kas/bank. Aturannya ada di CashTransferPoster. */
class CashTransferController extends Controller
{
    public function __construct(private readonly CashTransferPoster $poster) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->toString();

        $transfers = CashTransfer::query()
            ->with(['fromAccount', 'toAccount'])
            ->when($request->filled('from') && $request->filled('to'), fn ($q) => $q->between(
                $request->string('from')->toString(),
                $request->string('to')->toString(),
            ))
            ->when($request->filled('account_id'), fn ($q) => $q->where(
                fn ($inner) => $inner->where('from_account_id', $request->integer('account_id'))
                    ->orWhere('to_account_id', $request->integer('account_id')),
            ))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($search !== '', fn ($q) => $q->where(
                fn ($inner) => $inner->where('number', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%"),
            ))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(min($request->integer('per_page', 25), 100))
            ->withQueryString();

        return CashTransferResource::collection($transfers);
    }

    /** @throws CashTransferException */
    public function store(StoreCashTransferRequest $request): JsonResponse
    {
        $transfer = $this->poster->create(CashTransferData::fromRequest($request->validated()), $request->user());

        return (new CashTransferResource($this->loadDetail($transfer)))
            ->response()
            ->setStatusCode(201);
    }

    public function show(CashTransfer $cashTransfer): CashTransferResource
    {
        return new CashTransferResource($this->loadDetail($cashTransfer));
    }

    /** @throws CashTransferException */
    public function cancel(Request $request, CashTransfer $cashTransfer): CashTransferResource
    {
        return new CashTransferResource($this->loadDetail($this->poster->cancel($cashTransfer, $request->user())));
    }

    private function loadDetail(CashTransfer $transfer): CashTransfer
    {
        return $transfer->load(['fromAccount', 'toAccount', 'creator', 'journalEntry.lines.account']);
    }
}
