<?php

namespace App\Http\Controllers\Payables;

use App\Exceptions\SupplierPaymentException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payables\StoreSupplierPaymentRequest;
use App\Http\Resources\SupplierPaymentResource;
use App\Models\SupplierPayment;
use App\Services\Payables\SupplierPaymentData;
use App\Services\Payables\SupplierPaymentPoster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Pembayaran kepada supplier. Aturan pelunasannya ada di SupplierPaymentPoster. */
class SupplierPaymentController extends Controller
{
    public function __construct(private readonly SupplierPaymentPoster $poster) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->toString();

        $payments = SupplierPayment::query()
            ->with(['supplier', 'cashAccount', 'allocations.bill'])
            ->when($request->filled('from') && $request->filled('to'), fn ($query) => $query->between(
                $request->string('from')->toString(),
                $request->string('to')->toString(),
            ))
            ->when($request->filled('supplier_id'), fn ($query) => $query->where('supplier_id', $request->integer('supplier_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($search !== '', fn ($query) => $query->where(
                fn ($q) => $q->where('number', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")
                    ->orWhereHas('supplier', fn ($s) => $s->where('name', 'like', "%{$search}%")),
            ))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(min($request->integer('per_page', 25), 100))
            ->withQueryString();

        return SupplierPaymentResource::collection($payments);
    }

    /** @throws SupplierPaymentException */
    public function store(StoreSupplierPaymentRequest $request): JsonResponse
    {
        $payment = $this->poster->create(
            SupplierPaymentData::fromRequest($request->validated()),
            $request->user(),
        );

        return (new SupplierPaymentResource($this->loadDetail($payment)))
            ->response()
            ->setStatusCode(201);
    }

    public function show(SupplierPayment $supplierPayment): SupplierPaymentResource
    {
        return new SupplierPaymentResource($this->loadDetail($supplierPayment));
    }

    /** Membatalkan pembayaran; jurnalnya dibalik dan utangnya dikembalikan. */
    public function cancel(Request $request, SupplierPayment $supplierPayment): SupplierPaymentResource
    {
        $payment = $this->poster->cancel($supplierPayment, $request->user());

        return new SupplierPaymentResource($this->loadDetail($payment));
    }

    private function loadDetail(SupplierPayment $payment): SupplierPayment
    {
        return $payment->load([
            'supplier', 'cashAccount', 'creator',
            'allocations.bill.supplier',
            'journalEntry.lines.account',
        ]);
    }
}
