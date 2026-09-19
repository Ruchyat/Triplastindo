<?php

namespace App\Http\Controllers\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\SupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use App\Services\MasterCodeGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

/** Master supplier. Tidak ada penghapusan: supplier yang tidak dipakai dinonaktifkan. */
class SupplierController extends Controller
{
    public function __construct(private readonly MasterCodeGenerator $codes) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $suppliers = Supplier::query()
            ->when($request->boolean('with_activity'), fn ($query) => $query->withActivity($request->integer('year') ?: now()->year))
            ->when($request->has('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"));
            })
            ->orderBy('name')
            ->get();

        return SupplierResource::collection($suppliers);
    }

    public function store(SupplierRequest $request): JsonResponse
    {
        $data = $request->validated();

        $supplier = DB::transaction(function () use ($data) {
            $data['code'] = $data['code'] ?? $this->codes->next(Supplier::class, 'SUP');
            $data['is_active'] ??= true;

            return Supplier::query()->create($data);
        });

        return (new SupplierResource($supplier))->response()->setStatusCode(201);
    }

    /** Kode yang dikosongkan tidak diganti; dokumen lama merujuk ke sana. */
    public function update(SupplierRequest $request, Supplier $supplier): SupplierResource
    {
        $data = $request->validated();

        if (empty($data['code'])) {
            unset($data['code']);
        }

        $supplier->update($data);

        return new SupplierResource($supplier);
    }
}
