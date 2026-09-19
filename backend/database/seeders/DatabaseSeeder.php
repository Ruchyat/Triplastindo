<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SuperAdminSeeder::class,
            ChartOfAccountSeeder::class,
            MasterDataSeeder::class,
            AssetTypeSeeder::class,
        ]);

        // Data contoh hanya di lingkungan lokal; produksi mulai dari master
        // data yang bersih.
        if (app()->environment('local')) {
            $this->call(DemoDataSeeder::class);
        }
    }
}
