<?php

namespace App\Http\Controllers\Setup;

use App\Enums\ProductCategory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

/** Master produk dan item. */
class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Product::query()
            ->with('revenueAccount')
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
    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        $product = DB::transaction(function () use ($data) {
            $data['code'] = $data['code'] ?? $this->nextCode();
            $data['is_active'] = true;

            return Product::query()->create($data);
        });

        return (new ProductResource($product->load('revenueAccount')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Kode berikutnya berbentuk `PRD-0001`.
     *
     * Hanya kode berpola inilah yang dihitung; kode hasil seed seperti
     * `PRD-TAL` tidak ikut. Harus dipanggil di dalam transaksi: barisnya
     * dikunci agar dua penyimpanan bersamaan tidak memperoleh kode yang sama.
     */
    private function nextCode(): string
    {
        $last = Product::query()
            ->where('code', 'like', 'PRD-____')
            ->lockForUpdate()
            ->pluck('code')
            ->map(fn (string $code) => substr($code, -4))
            ->filter(fn (string $suffix) => ctype_digit($suffix))
            ->max();

        $sequence = $last === null ? 1 : ((int) $last) + 1;

        return 'PRD-'.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
