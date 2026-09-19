<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\AssetType;
use Illuminate\Database\Seeder;

/**
 * Jenis aset beserta pemetaan akunnya, mengikuti tab SETUP dan spesifikasi 5.13.
 *
 * Umur manfaat bawaan dari sheet: Mesin Biji 16 tahun, Mesin Tali dan
 * Pendukung 5 tahun; sisanya mengikuti kebiasaan umum.
 */
class AssetTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['Tanah', 0, false, '1-20000', null, null],
            ['Bangunan Pabrik', 20, true, '1-20001', '1-21001', '5-11008'],
            ['Gudang Produksi', 20, true, '1-20002', '1-21002', '5-11008'],
            ['Kendaraan Ops.', 8, true, '1-20003', '1-21003', '6-20004'],
            ['Mesin Biji', 16, true, '1-20004', '1-21004', '5-11007'],
            ['Mesin Produksi Tali', 5, true, '1-20005', '1-21005', '5-11007'],
            ['Mesin Pendukung', 5, true, '1-20006', '1-21006', '5-11007'],
            ['Peralatan Produksi', 8, true, '1-20007', '1-21008', '6-20005'],
            ['Peralatan Kantor', 4, true, '1-20008', '1-21009', '6-20006'],
        ];

        $accounts = Account::query()->pluck('id', 'code');

        foreach ($types as $order => [$name, $years, $depreciable, $asset, $accumulated, $expense]) {
            AssetType::query()->updateOrCreate(['name' => $name], [
                'default_useful_life_years' => $years,
                'is_depreciable' => $depreciable,
                'asset_account_id' => $accounts[$asset],
                'accumulated_account_id' => $accumulated ? $accounts[$accumulated] : null,
                'expense_account_id' => $expense ? $accounts[$expense] : null,
                'sort_order' => ($order + 1) * 10,
            ]);
        }
    }
}
