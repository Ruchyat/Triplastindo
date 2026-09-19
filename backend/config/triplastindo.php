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
        'opening_equity' => env('ACCOUNT_OPENING_EQUITY', '3-10006'),
        'dividend' => env('ACCOUNT_DIVIDEND', '3-10004'),
        'dividend_tax_payable' => env('ACCOUNT_DIVIDEND_TAX_PAYABLE', '2-10106'),
        'employee_receivable' => env('ACCOUNT_EMPLOYEE_RECEIVABLE', '1-10103'),
        'pph21_payable' => env('ACCOUNT_PPH21_PAYABLE', '2-10101'),
        'accrued_expense' => env('ACCOUNT_ACCRUED_EXPENSE', '2-10006'),
        'asset_disposal_loss' => env('ACCOUNT_ASSET_DISPOSAL_LOSS', '8-10002'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Akun beban gaji bawaan per departemen
    |--------------------------------------------------------------------------
    */

    'payroll_accounts' => [
        'produksi' => '5-11000',
        'kantor' => '6-10001',
        'lapangan' => '6-10002',
    ],

    /*
    |--------------------------------------------------------------------------
    | Pemakaian bahan: akun persediaan → akun HPP pemakaiannya
    |--------------------------------------------------------------------------
    |
    | Dipakai modul Inventory saat mencatat konsumsi bahan untuk produksi:
    | persediaan berkurang, HPP pemakaian bertambah.
    |
    */

    'material_usage' => [
        '1-10201' => '5-10000',
        '1-10200' => '5-10001',
        '1-10204' => '5-10002',
        '1-10205' => '5-11005',
    ],

    /*
    |--------------------------------------------------------------------------
    | Nilai bawaan pengaturan
    |--------------------------------------------------------------------------
    |
    | Dipakai bila kunci itu belum pernah disimpan di tabel `settings`.
    |
    */

    'settings' => [
        'company' => [
            'name' => 'Triplastindo',
            'address' => 'Jl. Raya Kedaung Barat No.78, Kedaung Barat, Sepatan Timur, Kabupaten Tangerang, Banten 15520',
            'website' => 'triplastindo.com',
            'email' => 'triplastindo@gmail.com',
            'phone' => '',
            'npwp' => '',
        ],
        'parameters' => [
            'minimum_cash' => '200000000',
            'dividend_tax_rate' => 0.1,
            'residual_value_rate' => 0.01,
            'fiscal_year' => 2026,
        ],
        'ratio_standards' => [
            'current_ratio' => 1.2,
            'quick_ratio' => 1.2,
            'gross_profit_margin' => 0.3,
            'net_profit_margin' => 0.2,
            'debt_to_equity' => 1.8,
            'cashflow_to_revenue' => 0.35,
        ],
        'payment_methods' => ['Cash', 'Transfer Antar Bank', 'Transfer Sesama Bank', 'E-Wallet', 'Kredit', 'Payroll', 'VA'],
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
