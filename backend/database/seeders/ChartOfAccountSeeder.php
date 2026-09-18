<?php

namespace Database\Seeders;

use App\Enums\NormalBalance;
use App\Models\Account;
use App\Models\AccountCategory;
use Illuminate\Database\Seeder;

/**
 * Menyemai kategori akun dan COA default Triplastindo.
 *
 * Dapat dijalankan berulang kali: akun dicocokkan berdasarkan kode, sehingga
 * seeder memperbarui nama atau kategori yang berubah tanpa menduplikasi akun,
 * dan tidak menyentuh status aktif yang mungkin sudah diubah pengguna.
 */
class ChartOfAccountSeeder extends Seeder
{
    public function run(): void
    {
        $definitions = require database_path('data/default-chart-of-accounts.php');
        $order = 0;

        foreach ($definitions as $categoryName => $definition) {
            $category = AccountCategory::query()->updateOrCreate(
                ['name' => $categoryName],
                ['group' => $definition['group'], 'sort_order' => $order += 10],
            );

            foreach ($definition['accounts'] as $code => $account) {
                [$name, $normalBalance] = $this->normalize($account, $definition['normal']);

                Account::query()->updateOrCreate(
                    ['code' => $code],
                    [
                        'name' => $name,
                        'account_category_id' => $category->id,
                        'normal_balance' => $normalBalance,
                        'is_cash' => $category->isCash(),
                    ],
                );
            }
        }

        $this->command?->info(
            AccountCategory::query()->count().' kategori dan '
            .Account::query()->count().' akun tersedia.'
        );
    }

    /**
     * Mengurai bentuk singkat `kode => nama` maupun `kode => [nama, saldo]`.
     *
     * @return array{string, NormalBalance}
     */
    private function normalize(string|array $account, NormalBalance $default): array
    {
        return is_array($account) ? $account : [$account, $default];
    }
}
