<?php

namespace App\Http\Controllers\ProfitSharing;

use App\Http\Controllers\Controller;
use App\Models\Shareholder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Master pemegang saham; persentasenya dihitung dari total saham aktif. */
class ShareholderController extends Controller
{
    public function index(): JsonResponse
    {
        $shareholders = Shareholder::query()->with('user')->orderBy('name')->get();
        $total = $shareholders->where('is_active', true)->sum('shares');

        return response()->json([
            'data' => $shareholders->map(fn (Shareholder $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'shares' => $s->shares,
                'percentage' => $total > 0 && $s->is_active ? $s->shares / $total : 0,
                'user_id' => $s->user_id,
                'user_name' => $s->user?->name,
                'is_active' => $s->is_active,
            ]),
            'meta' => ['total_shares' => $total],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $shareholder = Shareholder::query()->create($this->validate_($request));

        return response()->json(['data' => $shareholder], 201);
    }

    public function update(Request $request, Shareholder $shareholder): JsonResponse
    {
        $shareholder->update($this->validate_($request));

        return response()->json(['data' => $shareholder]);
    }

    /** @return array<string, mixed> */
    private function validate_(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'shares' => ['required', 'integer', 'min:0'],
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
