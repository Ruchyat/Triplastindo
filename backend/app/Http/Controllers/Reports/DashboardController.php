<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Services\Reports\DashboardReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Ringkasan keuangan untuk pemilik dan manajemen. */
class DashboardController extends Controller
{
    public function __construct(private readonly DashboardReport $dashboard) {}

    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'month' => ['nullable', 'integer', 'min:1', 'max:12'],
        ]);

        return response()->json([
            'data' => $this->dashboard->build(
                $request->integer('year') ?: now()->year,
                $request->integer('month') ?: now()->month,
            ),
        ]);
    }
}
