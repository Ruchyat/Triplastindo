<?php

namespace App\Http\Controllers\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\CustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Services\MasterCodeGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

/** Master customer. Tidak ada penghapusan: customer yang tidak dipakai dinonaktifkan. */
class CustomerController extends Controller
{
    public function __construct(private readonly MasterCodeGenerator $codes) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $customers = Customer::query()
            ->when($request->boolean('with_balance'), fn ($query) => $query->withBalances())
            ->when($request->boolean('with_activity'), fn ($query) => $query->withActivity($request->integer('year') ?: now()->year))
            ->when($request->has('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"));
            })
            ->orderBy('name')
            ->get();

        return CustomerResource::collection($customers);
    }

    public function store(CustomerRequest $request): JsonResponse
    {
        $data = $request->validated();

        $customer = DB::transaction(function () use ($data) {
            $data['code'] = $data['code'] ?? $this->codes->next(Customer::class, 'CUS');
            $data['is_active'] ??= true;

            return Customer::query()->create($data);
        });

        return (new CustomerResource($customer))->response()->setStatusCode(201);
    }

    /** Kode yang dikosongkan tidak diganti; dokumen lama merujuk ke sana. */
    public function update(CustomerRequest $request, Customer $customer): CustomerResource
    {
        $data = $request->validated();

        if (empty($data['code'])) {
            unset($data['code']);
        }

        $customer->update($data);

        return new CustomerResource($customer);
    }
}
