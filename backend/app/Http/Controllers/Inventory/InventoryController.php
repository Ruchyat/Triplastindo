<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\SalesInvoiceItem;
use App\Models\StockMovement;
use App\Services\Inventory\StockLedger;
use App\Services\Reports\ProfitLossReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * Summary Inventory & Penjualan, mengikuti tab di sheet: per produk, per bulan,
 * penjualan (Kg dan Rp), mutasi stok (masuk, keluar, sisa), dan nilai
 * persediaan; ditutup dengan HPP per Kg tahun berjalan.
 */
class InventoryController extends Controller
{
    public function __construct(
        private readonly StockLedger $ledger,
        private readonly ProfitLossReport $profitLoss,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $year = $request->integer('year') ?: now()->year;
        $yearStart = Carbon::create($year, 1, 1)->startOfDay();
        $yearEnd = $yearStart->copy()->endOfYear();

        // Diagregasi di PHP per produk-bulan-arah, agar tidak bergantung
        // fungsi tanggal tiap database.
        $movements = StockMovement::query()
            ->whereYear('date', $year)
            ->get(['product_id', 'date', 'direction', 'quantity', 'amount'])
            ->groupBy('product_id')
            ->map(fn ($rows) => $rows
                ->groupBy(fn ($r) => $r->date->format('n').'-'.$r->direction)
                ->map(fn ($g) => (object) [
                    'month' => (int) $g->first()->date->format('n'),
                    'direction' => $g->first()->direction,
                    'qty' => $g->reduce(fn ($s, $r) => bcadd($s, (string) $r->quantity, 3), '0.000'),
                    'amount' => $g->reduce(fn ($s, $r) => bcadd($s, (string) $r->amount, 2), '0.00'),
                ])
                ->values());

        $sales = SalesInvoiceItem::query()
            ->join('sales_invoices', 'sales_invoices.id', '=', 'sales_invoice_items.sales_invoice_id')
            ->whereNull('sales_invoices.deleted_at')
            ->whereNotIn('sales_invoices.status', ['draft', 'cancelled'])
            ->whereYear('sales_invoices.date', $year)
            ->get(['sales_invoice_items.product_id', 'sales_invoices.date', 'sales_invoice_items.quantity', 'sales_invoice_items.amount'])
            ->groupBy('product_id')
            ->map(fn ($rows) => $rows
                ->groupBy(fn ($r) => Carbon::parse($r->date)->format('n'))
                ->map(fn ($g, $m) => (object) [
                    'month' => (int) $m,
                    'qty' => $g->reduce(fn ($s, $r) => bcadd($s, (string) $r->quantity, 3), '0.000'),
                    'amount' => $g->reduce(fn ($s, $r) => bcadd($s, (string) $r->amount, 2), '0.00'),
                ])
                ->values());

        $products = Product::query()
            ->with('inventoryAccount')
            ->where(fn ($q) => $q->where('is_active', true)->orWhereIn('id', $movements->keys()))
            ->orderBy('name')
            ->get()
            ->map(function (Product $product) use ($movements, $sales, $yearStart) {
                $opening = $this->ledger->balance($product->id, $yearStart->copy()->subDay());
                $avgCost = $this->ledger->averageCost($product->id, now());
                $running = $opening;
                $rows = $movements->get($product->id, collect());
                $soldRows = $sales->get($product->id, collect());

                $months = collect(range(1, 12))->map(function (int $m) use ($rows, $soldRows, &$running, $avgCost) {
                    $in = (string) ($rows->first(fn ($r) => (int) $r->month === $m && $r->direction === 'in')->qty ?? 0);
                    $out = (string) ($rows->first(fn ($r) => (int) $r->month === $m && $r->direction === 'out')->qty ?? 0);
                    $sold = $soldRows->firstWhere('month', $m);
                    $running = bcsub(bcadd($running, $in, 3), $out, 3);

                    return [
                        'month' => $m,
                        'qty_in' => bcadd($in, '0', 3),
                        'qty_out' => bcadd($out, '0', 3),
                        'qty_balance' => $running,
                        'inventory_value' => bcmul($running, $avgCost, 2),
                        'sold_qty' => bcadd((string) ($sold->qty ?? 0), '0', 3),
                        'sales_amount' => bcadd((string) ($sold->amount ?? 0), '0', 2),
                        'cost_of_sold' => bcmul(bcadd((string) ($sold->qty ?? 0), '0', 3), $avgCost, 2),
                    ];
                });

                return [
                    'product_id' => $product->id,
                    'code' => $product->code,
                    'name' => $product->name,
                    'category' => $product->category->value,
                    'category_label' => $product->category->label(),
                    'unit' => $product->unit,
                    'inventory_account' => $product->inventoryAccount?->label(),
                    'opening_qty' => $opening,
                    'average_cost' => $avgCost,
                    'months' => $months->all(),
                    'totals' => [
                        'qty_in' => $months->reduce(fn ($s, $r) => bcadd($s, $r['qty_in'], 3), '0.000'),
                        'qty_out' => $months->reduce(fn ($s, $r) => bcadd($s, $r['qty_out'], 3), '0.000'),
                        'qty_balance' => $running,
                        'inventory_value' => bcmul($running, $avgCost, 2),
                        'sold_qty' => $months->reduce(fn ($s, $r) => bcadd($s, $r['sold_qty'], 3), '0.000'),
                        'sales_amount' => $months->reduce(fn ($s, $r) => bcadd($s, $r['sales_amount'], 2), '0.00'),
                    ],
                ];
            })
            ->values();

        return response()->json([
            'data' => [
                'year' => $year,
                'products' => $products,
                'hpp_per_kg' => $this->hppPerKg($yearStart, $yearEnd, $movements, $products),
            ],
        ]);
    }

    public function movements(Request $request): JsonResponse
    {
        $rows = StockMovement::query()
            ->with(['product', 'journalEntry'])
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->integer('product_id')))
            ->when($request->filled('from') && $request->filled('to'), fn ($q) => $q->whereBetween('date', [$request->string('from')->toString(), $request->string('to')->toString()]))
            ->orderByDesc('date')->orderByDesc('id')
            ->paginate(min($request->integer('per_page', 50), 200))
            ->withQueryString();

        $rows->getCollection()->transform(fn (StockMovement $m) => [
            'id' => $m->id,
            'date' => $m->date->toDateString(),
            'product' => ['id' => $m->product->id, 'code' => $m->product->code, 'name' => $m->product->name, 'unit' => $m->product->unit],
            'type' => $m->type,
            'type_label' => StockMovement::TYPES[$m->type] ?? $m->type,
            'direction' => $m->direction,
            'quantity' => (string) $m->quantity,
            'unit_cost' => (string) $m->unit_cost,
            'amount' => (string) $m->amount,
            'source_number' => $m->source_number,
            'journal_number' => $m->journalEntry?->number,
            'description' => $m->description,
        ]);

        return response()->json(['data' => $rows->items(), 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ]]);
    }

    /** Input mutasi stok dari modul Inventory: pemakaian, hasil produksi, penyesuaian, saldo awal. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')],
            'type' => ['required', Rule::in(['consumption', 'production_in', 'adjustment', 'opening'])],
            'direction' => ['required_if:type,adjustment', 'nullable', Rule::in(['in', 'out'])],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $product = Product::query()->findOrFail($data['product_id']);
        $date = Carbon::parse($data['date']);
        $qty = bcadd((string) $data['quantity'], '0', 3);

        $movement = match ($data['type']) {
            'consumption' => $this->ledger->consume($product, $date, $qty, $data['description'] ?? null, $request->user()),
            'production_in' => $this->ledger->produce($product, $date, $qty, $data['description'] ?? null, $request->user()),
            'opening' => $this->ledger->adjust($product, $date, 'in', $qty, bcadd((string) ($data['unit_cost'] ?? 0), '0', 2), $data['description'] ?? null, $request->user(), 'opening'),
            default => $this->ledger->adjust($product, $date, $data['direction'] ?? 'in', $qty, bcadd((string) ($data['unit_cost'] ?? 0), '0', 2), $data['description'] ?? null, $request->user()),
        };

        return response()->json(['data' => $movement], 201);
    }

    public function destroy(StockMovement $stockMovement): JsonResponse
    {
        if ($stockMovement->source_type !== null) {
            return response()->json(['message' => 'Mutasi dari dokumen dihapus lewat dokumennya.'], 422);
        }
        if ($stockMovement->journal_entry_id !== null) {
            return response()->json(['message' => 'Mutasi ini punya jurnal; hapus jurnalnya di Jurnal Umum lebih dahulu.'], 422);
        }

        $stockMovement->delete();

        return response()->json(['message' => 'Mutasi dihapus.']);
    }

    /**
     * HPP per Kg tahun berjalan: total HPP Produksi (Laba Rugi) dibagi Kg hasil
     * produksi; ditambah beban operasional per Kg terjual dan harga jual rata-rata.
     */
    private function hppPerKg(Carbon $from, Carbon $to, $movements, $products): array
    {
        $results = $this->profitLoss->build($from, $to);
        $totals = collect($results['sections'])->keyBy('key');
        $cogs = $totals['cogs']['total'];
        $opex = $totals['operating_expenses']['total'];
        $revenue = $results['results']['revenue'];

        $producedKg = StockMovement::query()->whereBetween('date', [$from, $to])->where('type', 'production_in')->sum('quantity');
        $soldKg = $products->reduce(fn ($s, $p) => bcadd($s, $p['totals']['sold_qty'], 3), '0.000');
        $purchasedKg = StockMovement::query()->whereBetween('date', [$from, $to])->where('type', 'purchase')->sum('quantity');
        $purchasedAmount = StockMovement::query()->whereBetween('date', [$from, $to])->where('type', 'purchase')->sum('amount');
        $materialUsed = collect($totals['cogs']['rows'])->filter(fn ($r) => str_starts_with($r['code'], '5-100'))->reduce(fn ($s, $r) => bcadd($s, $r['amount'], 2), '0.00');

        $div = fn (string $a, string|float|int $b): ?string => bccomp((string) $b, '0', 3) > 0 ? bcdiv($a, (string) $b, 2) : null;

        $hpp = $div($cogs, (string) $producedKg);
        $price = $div($revenue, $soldKg);

        return [
            'produced_kg' => bcadd((string) $producedKg, '0', 3),
            'sold_kg' => $soldKg,
            'purchased_kg' => bcadd((string) $purchasedKg, '0', 3),
            'purchased_amount' => bcadd((string) $purchasedAmount, '0', 2),
            'average_purchase_per_kg' => $div(bcadd((string) $purchasedAmount, '0', 2), (string) $purchasedKg),
            'material_per_kg' => $div($materialUsed, (string) $producedKg),
            'hpp_per_kg' => $hpp,
            'operational_per_kg' => $div($opex, $soldKg),
            'selling_price_per_kg' => $price,
            'margin_per_kg' => $hpp !== null && $price !== null ? bcsub($price, $hpp, 2) : null,
            'hpp_ratio' => $hpp !== null && $price !== null && bccomp($price, '0', 2) > 0 ? (float) $hpp / (float) $price : null,
        ];
    }
}
