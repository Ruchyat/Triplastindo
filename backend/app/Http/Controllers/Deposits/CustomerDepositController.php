<?php

namespace App\Http\Controllers\Deposits;

use App\Enums\DepositMovement;
use App\Exceptions\CustomerDepositException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Deposits\StoreCustomerDepositRequest;
use App\Http\Resources\CustomerDepositResource;
use App\Http\Resources\DepositBalanceResource;
use App\Models\CustomerDeposit;
use App\Services\Deposits\CustomerDepositData;
use App\Services\Deposits\CustomerDepositPoster;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Kartu deposit pelanggan. */
class CustomerDepositController extends Controller
{
    public function __construct(private readonly CustomerDepositPoster $poster) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $deposits = CustomerDeposit::query()
            ->with(['customer', 'cashAccount', 'invoice', 'journalEntry'])
            ->tap(fn ($query) => $this->applyFilters($query, $request))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(min($request->integer('per_page', 25), 100))
            ->withQueryString();

        return CustomerDepositResource::collection($deposits);
    }

    /**
     * Posisi deposit per customer.
     *
     * Inilah tampilan utama halaman Deposit: saldo deposit adalah pertanyaan
     * per customer — "si A masih punya titipan berapa" — bukan per tanggal.
     * Riwayat mutasinya baru dibuka setelah satu customer dipilih.
     *
     * Seluruhnya dijumlahkan database dalam satu kueri, bukan satu kueri per
     * customer. Hanya customer yang pernah punya mutasi yang muncul; yang
     * tidak pernah berdeposit tidak perlu memenuhi layar.
     */
    public function customers(Request $request): AnonymousResourceCollection
    {
        $rows = CustomerDeposit::query()
            ->posted()
            ->join('customers', 'customers.id', '=', 'customer_deposits.customer_id')
            ->groupBy('customer_deposits.customer_id', 'customers.code', 'customers.name')
            ->select('customer_deposits.customer_id', 'customers.code', 'customers.name')
            ->selectRaw($this->sumOf(DepositMovement::Received).' as received')
            ->selectRaw($this->sumOf(DepositMovement::Applied).' as applied')
            ->selectRaw($this->sumOf(DepositMovement::Refunded).' as refunded')
            ->selectRaw('MAX(customer_deposits.date) as last_activity')
            ->when($request->filled('search'), fn ($query) => $query->where(
                fn ($q) => $q->where('customers.name', 'like', '%'.$request->string('search')->toString().'%')
                    ->orWhere('customers.code', 'like', '%'.$request->string('search')->toString().'%'),
            ))
            // Menyaring ke customer yang saldonya masih ada.
            ->when($request->boolean('with_balance'), fn ($query) => $query->havingRaw(
                sprintf(
                    '%s - %s - %s > 0',
                    $this->sumOf(DepositMovement::Received),
                    $this->sumOf(DepositMovement::Applied),
                    $this->sumOf(DepositMovement::Refunded),
                )
            ))
            ->orderBy('customers.name')
            ->get();

        return DepositBalanceResource::collection($rows);
    }

    /** Potongan SQL penjumlahan satu jenis mutasi. */
    private function sumOf(DepositMovement $movement): string
    {
        return sprintf(
            "COALESCE(SUM(CASE WHEN customer_deposits.movement = '%s' THEN customer_deposits.amount ELSE 0 END), 0)",
            $movement->value,
        );
    }

    /**
     * Ringkasan kartu deposit.
     *
     * Saldo total dihitung dari seluruh mutasi tanpa memandang filter tanggal —
     * saldo adalah posisi saat ini, bukan jumlah yang terjadi dalam satu
     * periode. Dua angka lainnya justru mengikuti filternya.
     */
    public function summary(Request $request): JsonResponse
    {
        $scoped = fn () => CustomerDeposit::query()
            ->posted()
            ->tap(fn ($query) => $this->applyFilters($query, $request));

        $received = $scoped()->where('movement', DepositMovement::Received)->sum('amount');
        $out = $scoped()->whereIn('movement', [DepositMovement::Applied, DepositMovement::Refunded])->sum('amount');

        $allReceived = CustomerDeposit::query()->posted()->where('movement', DepositMovement::Received)->sum('amount');
        $allOut = CustomerDeposit::query()->posted()
            ->whereIn('movement', [DepositMovement::Applied, DepositMovement::Refunded])->sum('amount');

        return response()->json([
            'data' => [
                'total_balance' => $this->money(bcsub((string) $allReceived, (string) $allOut, 2)),
                'received' => $this->money($received),
                'applied_or_refunded' => $this->money($out),
            ],
        ]);
    }

    public function show(CustomerDeposit $customerDeposit): CustomerDepositResource
    {
        return new CustomerDepositResource($this->loadDetail($customerDeposit));
    }

    /** @throws CustomerDepositException */
    public function store(StoreCustomerDepositRequest $request): JsonResponse
    {
        $deposit = $this->poster->create(
            CustomerDepositData::fromRequest($request->validated()),
            $request->user(),
        );

        return (new CustomerDepositResource($this->loadDetail($deposit)))
            ->response()
            ->setStatusCode(201);
    }

    /** Membatalkan deposit masuk atau pengembalian; jurnalnya dibalik. */
    public function cancel(Request $request, CustomerDeposit $customerDeposit): CustomerDepositResource
    {
        $deposit = $this->poster->cancel($customerDeposit, $request->user());

        return new CustomerDepositResource($this->loadDetail($deposit));
    }

    /** @param  Builder<CustomerDeposit>  $query */
    private function applyFilters(Builder $query, Request $request): void
    {
        $query
            ->when($request->filled('from') && $request->filled('to'), fn ($q) => $q->whereBetween('date', [
                $request->string('from')->toString(),
                $request->string('to')->toString(),
            ]))
            ->when($request->filled('customer_id'), fn ($q) => $q->where('customer_id', $request->integer('customer_id')))
            ->when($request->filled('movement'), fn ($q) => $q->where('movement', $request->string('movement')->toString()))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($request->filled('search'), fn ($q) => $q->where(
                fn ($inner) => $inner->where('number', 'like', '%'.$request->string('search')->toString().'%')
                    ->orWhere('reference', 'like', '%'.$request->string('search')->toString().'%')
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', '%'.$request->string('search')->toString().'%')),
            ));
    }

    private function loadDetail(CustomerDeposit $deposit): CustomerDeposit
    {
        return $deposit->load([
            'customer', 'cashAccount', 'creator', 'invoice',
            'journalEntry.lines.account',
        ]);
    }
}
