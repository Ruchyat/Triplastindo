<?php

namespace App\Http\Controllers\Setup;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Profil perusahaan dan parameter perhitungan. */
class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Setting::everything()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company' => ['sometimes', 'array'],
            'company.name' => ['required_with:company', 'string', 'max:255'],
            'company.address' => ['nullable', 'string', 'max:500'],
            'company.website' => ['nullable', 'string', 'max:255'],
            'company.email' => ['nullable', 'email', 'max:255'],
            'company.phone' => ['nullable', 'string', 'max:64'],
            'company.npwp' => ['nullable', 'string', 'max:32'],
            'parameters' => ['sometimes', 'array'],
            'parameters.minimum_cash' => ['required_with:parameters', 'numeric', 'min:0'],
            'parameters.dividend_tax_rate' => ['required_with:parameters', 'numeric', 'min:0', 'max:1'],
            'parameters.residual_value_rate' => ['required_with:parameters', 'numeric', 'min:0', 'max:1'],
            'parameters.fiscal_year' => ['required_with:parameters', 'integer', 'min:2000', 'max:2100'],
            'ratio_standards' => ['sometimes', 'array'],
            'ratio_standards.*' => ['numeric', 'min:0'],
            'payment_methods' => ['sometimes', 'array', 'min:1'],
            'payment_methods.*' => ['string', 'max:64'],
        ]);

        foreach ($data as $key => $value) {
            Setting::put($key, $key === 'parameters'
                ? [...$value, 'minimum_cash' => bcadd((string) $value['minimum_cash'], '0', 2)]
                : $value);
        }

        return response()->json(['data' => Setting::everything()]);
    }
}
