<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Akun Super Admin
    |--------------------------------------------------------------------------
    |
    | Dipakai oleh SuperAdminSeeder untuk membuat akun pertama. Ubah nilainya
    | lewat .env, jangan di berkas ini, agar kredensial tidak ikut ter-commit.
    |
    */

    'super_admin' => [
        'name' => env('SUPER_ADMIN_NAME', 'Super Admin'),
        'email' => env('SUPER_ADMIN_EMAIL', 'admin@triplastindo.com'),
        'password' => env('SUPER_ADMIN_PASSWORD', 'password'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Akun Baku untuk Jurnal Otomatis
    |--------------------------------------------------------------------------
    |
    | Kode akun yang dipakai modul transaksi saat membentuk jurnal. Dikumpulkan
    | di sini supaya perusahaan dapat memindahkannya ke akun lain tanpa
    | mengubah kode program, dan supaya tidak ada kode akun yang tersebar
    | sebagai teks di dalam service.
    |
    */

    'accounts' => [
        'cash' => env('ACCOUNT_CASH', '1-10001'),
        'receivable' => env('ACCOUNT_RECEIVABLE', '1-10100'),
        'payable' => env('ACCOUNT_PAYABLE', '2-10000'),
        'customer_deposit' => env('ACCOUNT_CUSTOMER_DEPOSIT', '2-10007'),
        'output_tax' => env('ACCOUNT_OUTPUT_TAX', '2-10100'),
        'input_tax' => env('ACCOUNT_INPUT_TAX', '1-10302'),
        'default_revenue' => env('ACCOUNT_DEFAULT_REVENUE', '4-10002'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Kategori Pembelian
    |--------------------------------------------------------------------------
    |
    | Kategori pembelian menentukan akun mana yang didebit, dan akun utang mana
    | yang dipakai bila pembeliannya bertermin. Dikumpulkan di sini supaya
    | perusahaan dapat memindahkannya ketika COA berkembang — misalnya bila
    | Bahan Pendukung kelak mendapat akun persediaannya sendiri.
    |
    | `debit` bernilai null berarti akunnya dipilih pengguna pada form.
    |
    | Karung bekas adalah bahan baku utama pabrik ini, dibeli dari pemasok
    | karung — karena itu bahan baku memakai akun Hutang Supplier Karung.
    | Karung baru dipakai sebagai wadah barang jadi dan masuk Bahan Pendukung.
    |
    */

    'purchase_categories' => [
        'bahan_baku_polos' => ['debit' => '1-10201', 'payable' => '2-10001'],
        'bahan_baku_kw' => ['debit' => '1-10200', 'payable' => '2-10001'],
        'bahan_pendukung' => ['debit' => '1-10204', 'payable' => '2-10002'],
        'sparepart' => ['debit' => '1-10205', 'payable' => '2-10000'],
        'perlengkapan_produksi' => ['debit' => '5-11010', 'payable' => '2-10000'],
        'pelumas_mesin' => ['debit' => '5-11004', 'payable' => '2-10000'],
        'jasa_maintenance' => ['debit' => '5-11006', 'payable' => '2-10000'],
        'perlengkapan_kantor' => ['debit' => '6-10005', 'payable' => '2-10000'],
        'lainnya' => ['debit' => null, 'payable' => '2-10000'],
    ],

];
