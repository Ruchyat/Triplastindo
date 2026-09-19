<?php

namespace App\Http\Controllers\Assets;

use App\Http\Controllers\Controller;
use App\Http\Resources\FixedAssetResource;
use App\Models\AssetDepreciation;
use App\Models\AssetType;
use App\Models\FixedAsset;
use App\Services\Assets\DepreciationRunner;
use App\Services\Assets\FixedAssetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/** Aset tetap, jenisnya, dan penyusutan bulanan. */
class FixedAssetController extends Controller
{
    public function __construct(
        private readonly FixedAssetService $assets,
        private readonly DepreciationRunner $depreciation,
    ) {}

    public function types(): JsonResponse
    {
        $types = AssetType::query()
            ->with(['assetAccount', 'accumulatedAccount', 'expenseAccount'])
            ->withCount('assets')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (AssetType $type) => [
                'id' => $type->id,
                'name' => $type->name,
                'default_useful_life_years' => $type->default_useful_life_years,
                'is_depreciable' => $type->is_depreciable,
                'asset_account' => $type->assetAccount?->label(),
                'accumulated_account' => $type->accumulatedAccount?->label(),
                'expense_account' => $type->expenseAccount?->label(),
                'asset_account_id' => $type->asset_account_id,
                'accumulated_account_id' => $type->accumulated_account_id,
                'expense_account_id' => $type->expense_account_id,
                'assets_count' => $type->assets_count,
            ]);

        return response()->json(['data' => $types]);
    }

    public function storeType(Request $request): JsonResponse
    {
        $data = $this->validateType($request);
        $type = AssetType::query()->create($data);

        return response()->json(['data' => $type], 201);
    }

    public function updateType(Request $request, AssetType $assetType): JsonResponse
    {
        $assetType->update($this->validateType($request, $assetType));

        return response()->json(['data' => $assetType]);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $assets = FixedAsset::query()
            ->with('type')
            ->when($request->filled('asset_type_id'), fn ($q) => $q->where('asset_type_id', $request->integer('asset_type_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->orderBy('code')
            ->get();

        return FixedAssetResource::collection($assets);
    }

    public function store(Request $request): JsonResponse
    {
        $asset = $this->assets->create($this->validateAsset($request), $request->user());

        return (new FixedAssetResource($asset->load('type')))->response()->setStatusCode(201);
    }

    public function show(FixedAsset $fixedAsset): FixedAssetResource
    {
        return new FixedAssetResource($fixedAsset->load(['type', 'depreciations']));
    }

    public function update(Request $request, FixedAsset $fixedAsset): FixedAssetResource
    {
        return new FixedAssetResource($this->assets->update($fixedAsset, $this->validateAsset($request, $fixedAsset))->load('type'));
    }

    public function dispose(Request $request, FixedAsset $fixedAsset): FixedAssetResource
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'proceeds' => ['nullable', 'numeric', 'min:0'],
            'cash_account_id' => ['required_if:proceeds,>0', 'nullable', 'integer', Rule::exists('accounts', 'id')],
        ]);

        $asset = $this->assets->dispose(
            $fixedAsset,
            Carbon::parse($data['date']),
            (string) ($data['proceeds'] ?? 0),
            $data['cash_account_id'] ?? null,
            $request->user(),
        );

        return new FixedAssetResource($asset->load(['type', 'depreciations']));
    }

    /** Rekap penyusutan per bulan dalam satu tahun, per jenis aset. */
    public function schedule(Request $request): JsonResponse
    {
        $year = $request->integer('year') ?: now()->year;

        $posted = AssetDepreciation::query()
            ->where('year', $year)
            ->selectRaw('month, SUM(amount) as total, COUNT(*) as assets')
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $byType = AssetType::query()->orderBy('sort_order')->get()->map(function (AssetType $type) use ($year) {
            $months = AssetDepreciation::query()
                ->whereHas('asset', fn ($q) => $q->where('asset_type_id', $type->id))
                ->where('year', $year)
                ->selectRaw('month, SUM(amount) as total')
                ->groupBy('month')
                ->pluck('total', 'month');

            $monthly = FixedAsset::query()->with('type')->where('asset_type_id', $type->id)->where('status', 'active')->get()
                ->reduce(fn (string $sum, FixedAsset $a) => bcadd($sum, $a->monthlyDepreciation(), 2), '0.00');

            return [
                'type' => $type->name,
                'monthly_expected' => $monthly,
                'yearly_expected' => bcmul($monthly, '12', 2),
                'months' => collect(range(1, 12))->map(fn (int $m) => bcadd((string) ($months[$m] ?? 0), '0', 2))->all(),
            ];
        });

        return response()->json([
            'data' => [
                'year' => $year,
                'months' => collect(range(1, 12))->map(fn (int $m) => [
                    'month' => $m,
                    'posted' => $posted->has($m),
                    'total' => bcadd((string) ($posted[$m]->total ?? 0), '0', 2),
                    'assets' => (int) ($posted[$m]->assets ?? 0),
                ])->all(),
                'by_type' => $byType->all(),
            ],
        ]);
    }

    public function runDepreciation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        return response()->json(['data' => $this->depreciation->run((int) $data['year'], (int) $data['month'], $request->user())], 201);
    }

    public function undoDepreciation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $this->depreciation->undo((int) $data['year'], (int) $data['month'], $request->user());

        return response()->json(['message' => 'Penyusutan dibatalkan.']);
    }

    /** @return array<string, mixed> */
    private function validateType(Request $request, ?AssetType $current = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:64', Rule::unique('asset_types', 'name')->ignore($current)],
            'default_useful_life_years' => ['required', 'integer', 'min:0', 'max:100'],
            'is_depreciable' => ['required', 'boolean'],
            'asset_account_id' => ['required', 'integer', Rule::exists('accounts', 'id')],
            'accumulated_account_id' => ['required_if:is_depreciable,true', 'nullable', 'integer', Rule::exists('accounts', 'id')],
            'expense_account_id' => ['required_if:is_depreciable,true', 'nullable', 'integer', Rule::exists('accounts', 'id')],
            'sort_order' => ['nullable', 'integer'],
        ]);
    }

    /** @return array<string, mixed> */
    private function validateAsset(Request $request, ?FixedAsset $current = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:24', Rule::unique('fixed_assets', 'code')->ignore($current)],
            'name' => ['required', 'string', 'max:255'],
            'asset_type_id' => ['required', 'integer', Rule::exists('asset_types', 'id')],
            'acquisition_date' => ['required', 'date'],
            'in_use_date' => ['nullable', 'date', 'after_or_equal:acquisition_date'],
            'cost' => ['required', 'numeric', 'min:0'],
            'residual_value' => ['nullable', 'numeric', 'min:0'],
            'useful_life_years' => ['nullable', 'integer', 'min:0', 'max:100'],
            'opening_accumulated' => ['nullable', 'numeric', 'min:0'],
            'funding' => ['nullable', Rule::in(['opening', 'cash', 'payable'])],
            'cash_account_id' => ['required_if:funding,cash', 'nullable', 'integer', Rule::exists('accounts', 'id')],
            'note' => ['nullable', 'string', 'max:255'],
        ]);
    }
}
