<?php

namespace App\Http\Controllers\Purchases;

use App\Enums\DocumentStatus;
use App\Exceptions\PurchaseBillException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Purchases\StorePurchaseBillRequest;
use App\Http\Resources\PurchaseBillResource;
use App\Models\PurchaseBill;
use App\Services\Purchases\PurchaseBillData;
use App\Services\Purchases\PurchaseBillPoster;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Tagihan pembelian. Aturan pembeliannya ada di PurchaseBillPoster. */
class PurchaseBillController extends Controller
{
    public function __construct(private readonly PurchaseBillPoster $poster) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $bills = PurchaseBill::query()
            ->with(['supplier', 'items.product'])
            ->tap(fn ($query) => $this->applyFilters($query, $request))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(min($request->integer('per_page', 25), 100))
            ->withQueryString();

        return PurchaseBillResource::collection($bills);
    }

    /** Total pembelian, uang dibayar, dan utang terbuka untuk filter yang sama. */
    public function summary(Request $request): JsonResponse
    {
        $scope = fn () => PurchaseBill::query()
            ->whereNot('status', DocumentStatus::Cancelled)
            ->tap(fn ($query) => $this->applyFilters($query, $request));

        return response()->json([
            'data' => [
                'total_purchases' => $this->money($scope()->sum('total')),
                'paid' => $this->money($scope()->sum('paid_amount')),
                'open_payable' => $this->money(
                    $scope()->outstanding()
                        ->selectRaw('COALESCE(SUM(total - paid_amount), 0) as balance')
                        ->value('balance')
                ),
                'overdue_count' => $scope()->outstanding()->whereDate('due_date', '<', now())->count(),
            ],
        ]);
    }

    /** @throws PurchaseBillException */
    public function store(StorePurchaseBillRequest $request): JsonResponse
    {
        $bill = $this->poster->create(
            PurchaseBillData::fromRequest($request->validated()),
            $request->user(),
            $request->shouldPost(),
        );

        return (new PurchaseBillResource($this->loadDetail($bill)))
            ->response()
            ->setStatusCode(201);
    }

    public function show(PurchaseBill $purchaseBill): PurchaseBillResource
    {
        return new PurchaseBillResource($this->loadDetail($purchaseBill));
    }

    public function post(Request $request, PurchaseBill $purchaseBill): PurchaseBillResource
    {
        return new PurchaseBillResource(
            $this->loadDetail($this->poster->post($purchaseBill, $request->user()))
        );
    }

    public function cancel(Request $request, PurchaseBill $purchaseBill): PurchaseBillResource
    {
        return new PurchaseBillResource(
            $this->loadDetail($this->poster->cancel($purchaseBill, $request->user()))
        );
    }

    /** @throws PurchaseBillException */
    public function destroy(PurchaseBill $purchaseBill): JsonResponse
    {
        if ($purchaseBill->status !== DocumentStatus::Draft) {
            throw PurchaseBillException::draftOnly($purchaseBill->number);
        }

        $purchaseBill->delete();

        return response()->json(['message' => "Draft {$purchaseBill->number} dihapus."]);
    }

    /** @param  Builder<PurchaseBill>  $query */
    private function applyFilters(Builder $query, Request $request): void
    {
        $query
            ->when($request->filled('from') && $request->filled('to'), fn ($q) => $q->whereBetween('date', [
                $request->string('from')->toString(),
                $request->string('to')->toString(),
            ]))
            ->when($request->filled('supplier_id'), fn ($q) => $q->where('supplier_id', $request->integer('supplier_id')))
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->string('category')->toString()))
            // `outstanding` bukan status tersimpan: gabungan belum bayar dan sebagian,
            // dipakai halaman Utang/Piutang.
            ->when($request->filled('status'), fn ($q) => $request->string('status')->toString() === 'outstanding'
                ? $q->outstanding()
                : $q->where('status', $request->string('status')->toString()))
            ->when($request->boolean('outstanding'), fn ($q) => $q->outstanding())
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search')->toString();
                $q->where(fn ($inner) => $inner->where('number', 'like', "%{$search}%")
                    ->orWhere('supplier_invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', fn ($s) => $s->where('name', 'like', "%{$search}%")));
            });
    }

    private function loadDetail(PurchaseBill $bill): PurchaseBill
    {
        return $bill->load([
            'supplier', 'cashAccount', 'expenseAccount', 'creator',
            'items.product',
            'journalEntry.lines.account',
        ]);
    }
}
