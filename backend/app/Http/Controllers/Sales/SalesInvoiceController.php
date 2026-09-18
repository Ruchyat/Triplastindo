<?php

namespace App\Http\Controllers\Sales;

use App\Enums\DocumentStatus;
use App\Exceptions\SalesInvoiceException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\StoreSalesInvoiceRequest;
use App\Http\Resources\SalesInvoiceResource;
use App\Models\SalesInvoice;
use App\Services\Sales\SalesInvoiceData;
use App\Services\Sales\SalesInvoicePoster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Invoice penjualan.
 *
 * Controller ini tipis dengan sengaja: seluruh aturan penjualan ada di
 * SalesInvoicePoster, sehingga modul lain — dan nanti impor data maupun
 * perintah artisan — memakai aturan yang sama tanpa lewat HTTP.
 */
class SalesInvoiceController extends Controller
{
    public function __construct(private readonly SalesInvoicePoster $poster) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $invoices = SalesInvoice::query()
            ->with(['customer', 'items.product'])
            ->when($request->filled('from') && $request->filled('to'), fn ($query) => $query->between(
                $request->string('from')->toString(),
                $request->string('to')->toString(),
            ))
            ->when($request->filled('customer_id'), fn ($query) => $query->where('customer_id', $request->integer('customer_id')))
            // `outstanding` bukan status tersimpan: gabungan belum bayar dan sebagian,
            // dipakai halaman Utang/Piutang.
            ->when($request->filled('status'), fn ($query) => $request->string('status')->toString() === 'outstanding'
                ? $query->outstanding()
                : $query->where('status', $request->string('status')->toString()))
            ->when($request->boolean('outstanding'), fn ($query) => $query->outstanding())
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(fn ($q) => $q->where('number', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%")));
            })
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(min($request->integer('per_page', 25), 100))
            ->withQueryString();

        return SalesInvoiceResource::collection($invoices);
    }

    /**
     * Ringkasan nilai penjualan untuk kartu statistik.
     *
     * Dihitung backend, bukan dijumlahkan frontend dari daftar yang tampil:
     * daftarnya dipaginasi, sehingga penjumlahan di frontend hanya akan
     * mencakup halaman yang sedang dibuka dan angkanya akan salah.
     */
    public function summary(Request $request): JsonResponse
    {
        $scope = fn () => SalesInvoice::query()
            ->whereNot('status', DocumentStatus::Cancelled)
            ->when($request->filled('from') && $request->filled('to'), fn ($query) => $query->between(
                $request->string('from')->toString(),
                $request->string('to')->toString(),
            ))
            ->when($request->filled('customer_id'), fn ($query) => $query->where('customer_id', $request->integer('customer_id')));

        return response()->json([
            'data' => [
                'total_sales' => $this->money($scope()->sum('total')),
                'received' => $this->money($scope()->sum('paid_amount')),
                'open_receivable' => $this->money($scope()->outstanding()->selectRaw('COALESCE(SUM(total - paid_amount), 0) as balance')->value('balance')),
                'overdue_count' => $scope()->outstanding()->whereDate('due_date', '<', now())->count(),
            ],
        ]);
    }

    /** @throws SalesInvoiceException */
    public function store(StoreSalesInvoiceRequest $request): JsonResponse
    {
        $invoice = $this->poster->create(
            SalesInvoiceData::fromRequest($request->validated()),
            $request->user(),
            $request->shouldPost(),
        );

        return (new SalesInvoiceResource($this->loadDetail($invoice)))
            ->response()
            ->setStatusCode(201);
    }

    public function show(SalesInvoice $salesInvoice): SalesInvoiceResource
    {
        return new SalesInvoiceResource($this->loadDetail($salesInvoice));
    }

    /** Memposting invoice yang masih draft. */
    public function post(Request $request, SalesInvoice $salesInvoice): SalesInvoiceResource
    {
        $invoice = $this->poster->post($salesInvoice, $request->user());

        return new SalesInvoiceResource($this->loadDetail($invoice));
    }

    /** Membatalkan invoice yang sudah diposting; jurnalnya dibalik. */
    public function cancel(Request $request, SalesInvoice $salesInvoice): SalesInvoiceResource
    {
        $invoice = $this->poster->cancel($salesInvoice, $request->user());

        return new SalesInvoiceResource($this->loadDetail($invoice));
    }

    /**
     * Menghapus invoice yang masih draft.
     *
     * Invoice yang sudah diposting tidak dapat dihapus — jurnalnya sudah
     * terbaca oleh laporan, dan yang benar adalah membatalkannya.
     *
     * @throws SalesInvoiceException
     */
    public function destroy(SalesInvoice $salesInvoice): JsonResponse
    {
        if ($salesInvoice->status !== DocumentStatus::Draft) {
            throw SalesInvoiceException::draftOnly($salesInvoice->number);
        }

        $salesInvoice->delete();

        return response()->json(['message' => "Draft {$salesInvoice->number} dihapus."]);
    }

    private function loadDetail(SalesInvoice $invoice): SalesInvoice
    {
        return $invoice->load([
            'customer', 'cashAccount', 'creator',
            'items.product.revenueAccount',
            'journalEntry.lines.account',
            'allocations.receipt.cashAccount',
            'depositApplications',
        ]);
    }
}
