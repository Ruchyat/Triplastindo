<?php

namespace App\Http\Controllers\Receivables;

use App\Exceptions\PaymentReceiptException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Receivables\StorePaymentReceiptRequest;
use App\Http\Resources\PaymentReceiptResource;
use App\Models\PaymentReceipt;
use App\Services\Receivables\PaymentReceiptData;
use App\Services\Receivables\PaymentReceiptPoster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Penerimaan pembayaran dari customer.
 *
 * Seperti invoice, controller ini tipis: aturan pelunasan ada di
 * PaymentReceiptPoster.
 */
class PaymentReceiptController extends Controller
{
    public function __construct(private readonly PaymentReceiptPoster $poster) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $receipts = PaymentReceipt::query()
            ->with(['customer', 'cashAccount', 'allocations.invoice'])
            ->when($request->filled('from') && $request->filled('to'), fn ($query) => $query->between(
                $request->string('from')->toString(),
                $request->string('to')->toString(),
            ))
            ->when($request->filled('customer_id'), fn ($query) => $query->where('customer_id', $request->integer('customer_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('search'), fn ($query) => $query->where(
                fn ($q) => $q->where('number', 'like', '%'.$request->string('search')->toString().'%')
                    ->orWhere('reference', 'like', '%'.$request->string('search')->toString().'%')
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', '%'.$request->string('search')->toString().'%')),
            ))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(min($request->integer('per_page', 25), 100))
            ->withQueryString();

        return PaymentReceiptResource::collection($receipts);
    }

    /** @throws PaymentReceiptException */
    public function store(StorePaymentReceiptRequest $request): JsonResponse
    {
        $receipt = $this->poster->create(
            PaymentReceiptData::fromRequest($request->validated()),
            $request->user(),
        );

        return (new PaymentReceiptResource($this->loadDetail($receipt)))
            ->response()
            ->setStatusCode(201);
    }

    public function show(PaymentReceipt $paymentReceipt): PaymentReceiptResource
    {
        return new PaymentReceiptResource($this->loadDetail($paymentReceipt));
    }

    /** Membatalkan penerimaan; jurnalnya dibalik dan piutangnya dikembalikan. */
    public function cancel(Request $request, PaymentReceipt $paymentReceipt): PaymentReceiptResource
    {
        $receipt = $this->poster->cancel($paymentReceipt, $request->user());

        return new PaymentReceiptResource($this->loadDetail($receipt));
    }

    private function loadDetail(PaymentReceipt $receipt): PaymentReceipt
    {
        return $receipt->load([
            'customer', 'cashAccount', 'creator',
            'allocations.invoice.customer',
            'journalEntry.lines.account',
        ]);
    }
}
