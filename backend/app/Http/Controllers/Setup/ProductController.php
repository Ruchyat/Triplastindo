<?php

namespace App\Http\Controllers\Setup;

use App\Enums\ProductCategory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\MasterCodeGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

/** Master produk dan item. */
class ProductController extends Controller
{
    public function __construct(private readonly MasterCodeGenerator $codes) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Product::query()
            ->with(['revenueAccount', 'inventoryAccount'])
            ->when($request->has('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->when($request->filled('category'), fn ($query) => $query->where('category', $request->string('category')->toString()))
            ->orderBy('name')
            ->get();

        return ProductResource::collection($products);
    }

    /** Daftar kategori produk untuk dropdown form. */
    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => array_map(fn (ProductCategory $category) => [
                'value' => $category->value,
                'label' => $category->label(),
            ], ProductCategory::cases()),
        ]);
    }

    /**
     * Menambah produk.
     *
     * Dipakai juga langsung dari form pembelian, saat barang yang dibeli belum
     * ada di master — pencatat tidak perlu meninggalkan tagihannya.
     */
    public function store(ProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        $product = DB::transaction(function () use ($data) {
            $data['code'] = $data['code'] ?? $this->codes->next(Product::class, 'PRD');
            $data['is_active'] ??= true;

            return Product::query()->create($data);
        });

        return (new ProductResource($product->load(['revenueAccount', 'inventoryAccount'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Menyunting produk.
     *
     * Kode yang dikosongkan tidak diganti — kode lama tetap dipakai, karena
     * dokumen yang sudah ada merujuk ke sana.
     */
    public function update(ProductRequest $request, Product $product): ProductResource
    {
        $data = $request->validated();

        if (empty($data['code'])) {
            unset($data['code']);
        }

        $product->update($data);

        return new ProductResource($product->load(['revenueAccount', 'inventoryAccount']));
    }
}
