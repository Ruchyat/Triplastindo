<?php

namespace Database\Seeders;

use App\Enums\ProductCategory;
use App\Models\Account;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

/**
 * Master customer, supplier, dan produk awal.
 *
 * Isinya diambil dari nama-nama yang selama ini muncul pada mock UI, supaya
 * halaman Penjualan terlihat wajar begitu tersambung ke database dan dapat
 * langsung dipakai tanpa mengisi master data lebih dulu.
 *
 * Aman dijalankan berulang kali: dicocokkan berdasarkan kode.
 */
class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedCustomers();
        $this->seedSuppliers();
        $this->seedProducts();

        $this->command?->info(
            Customer::query()->count().' customer, '
            .Supplier::query()->count().' supplier, dan '
            .Product::query()->count().' produk tersedia.'
        );
    }

    /**
     * Supplier awal, dikelompokkan menurut apa yang mereka pasok.
     *
     * Pemasok karung bekas adalah pemasok bahan baku utama pabrik ini; pemasok
     * karung baru masuk kelompok bahan pendukung.
     */
    private function seedSuppliers(): void
    {
        $suppliers = [
            ['code' => 'SUP-001', 'name' => 'PT Sumber Plastik', 'contact_name' => 'Bapak Hendra', 'phone' => '021-5560101', 'payment_term_days' => 30],
            ['code' => 'SUP-002', 'name' => 'UD Karung Bekas Jaya', 'contact_name' => 'Bapak Slamet', 'phone' => '021-5560102', 'payment_term_days' => 14],
            ['code' => 'SUP-003', 'name' => 'CV Karung Baru Sentosa', 'contact_name' => 'Ibu Ratna', 'phone' => '021-5560103', 'payment_term_days' => 30],
            ['code' => 'SUP-004', 'name' => 'CV Teknik Makmur', 'contact_name' => 'Bapak Yanto', 'phone' => '021-5560104', 'payment_term_days' => 45],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::query()->updateOrCreate(['code' => $supplier['code']], $supplier);
        }
    }

    private function seedCustomers(): void
    {
        $customers = [
            ['code' => 'CUS-001', 'name' => 'PT Tali Nusantara', 'contact_name' => 'Bapak Andi', 'phone' => '021-5550101', 'payment_term_days' => 30],
            ['code' => 'CUS-002', 'name' => 'CV Berkah Plastik', 'contact_name' => 'Ibu Sari', 'phone' => '021-5550102', 'payment_term_days' => 14],
            ['code' => 'CUS-003', 'name' => 'UD Makmur Jaya', 'contact_name' => 'Bapak Rudi', 'phone' => '021-5550103', 'payment_term_days' => 30],
            ['code' => 'CUS-004', 'name' => 'PT Karya Mandiri', 'contact_name' => 'Ibu Dewi', 'phone' => '021-5550104', 'payment_term_days' => 45],
        ];

        foreach ($customers as $customer) {
            Customer::query()->updateOrCreate(['code' => $customer['code']], $customer);
        }
    }

    private function seedProducts(): void
    {
        // Pemetaan akun inilah yang membuat pengguna cukup memilih produk,
        // dan sistem tahu sendiri ke akun pendapatan mana jurnalnya masuk.
        $products = [
            ['code' => 'PRD-TAL', 'name' => 'Tali', 'category' => ProductCategory::Tali, 'revenue' => '4-10000', 'inventory' => '1-10203'],
            ['code' => 'PRD-BIJ', 'name' => 'Biji Plastik', 'category' => ProductCategory::BijiPlastik, 'revenue' => '4-10001', 'inventory' => '1-10202'],
            ['code' => 'PRD-BBP', 'name' => 'Bahan Baku Polos', 'category' => ProductCategory::BahanBaku, 'revenue' => null, 'inventory' => '1-10201'],
            ['code' => 'PRD-BBK', 'name' => 'Bahan Baku KW', 'category' => ProductCategory::BahanBaku, 'revenue' => null, 'inventory' => '1-10200'],
            ['code' => 'PRD-SPR', 'name' => 'Sparepart Mesin', 'category' => ProductCategory::Sparepart, 'revenue' => null, 'inventory' => '1-10205'],
            ['code' => 'PRD-KRG', 'name' => 'Karung Polos', 'category' => ProductCategory::BahanPendukung, 'revenue' => null, 'inventory' => '1-10204'],
            ['code' => 'PRD-RES', 'name' => 'Residu Produksi', 'category' => ProductCategory::Lainnya, 'revenue' => '4-10002', 'inventory' => '1-10204'],
        ];

        $accounts = Account::query()->pluck('id', 'code');

        foreach ($products as $product) {
            Product::query()->updateOrCreate(
                ['code' => $product['code']],
                [
                    'name' => $product['name'],
                    'category' => $product['category'],
                    'unit' => 'Kg',
                    'revenue_account_id' => $accounts[$product['revenue']] ?? null,
                    'inventory_account_id' => $accounts[$product['inventory']] ?? null,
                ],
            );
        }
    }
}
