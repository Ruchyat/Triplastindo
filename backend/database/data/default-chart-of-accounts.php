<?php

/*
|--------------------------------------------------------------------------
| COA Default Triplastindo
|--------------------------------------------------------------------------
|
| Disalin dari Lampiran A dokumen spesifikasi, yang sendirinya diambil dari
| Google Sheet yang sedang dipakai. Berkas ini juga menjadi sumber tombol
| "Muat COA default Triplastindo" pada halaman Setup.
|
| Bentuk datanya: kategori berisi kelompok, saldo normal bawaan, dan daftar
| akunnya. Akun ditulis `kode => nama`; bila saldo normalnya menyimpang dari
| bawaan kategori, ditulis `kode => [nama, saldo normal]`. Penyimpangan itu
| adalah akun kontra — Cadangan Kerugian Piutang, Retur Penjualan, Dividen —
| yang berada di kategori yang sama namun bergerak ke arah sebaliknya.
|
*/

use App\Enums\AccountGroup;
use App\Enums\NormalBalance;

return [
    'Kas & Bank' => [
        'group' => AccountGroup::AsetLancar,
        'normal' => NormalBalance::Debit,
        'accounts' => [
            '1-10001' => 'Kas',
            '1-10002' => 'Petty Cash',
            '1-10003' => 'Bank BCA',
            '1-10004' => 'Bank BNI',
            '1-10005' => 'Bank BRI',
            '1-10006' => 'Giro',
            '1-10010' => 'Cash Advance Karyawan',
        ],
    ],

    'Piutang Usaha' => [
        'group' => AccountGroup::AsetLancar,
        'normal' => NormalBalance::Debit,
        'accounts' => [
            '1-10100' => 'Piutang Usaha',
            '1-10101' => 'Piutang Belum Ditagihkan',
            '1-10102' => ['Cadangan Kerugian Piutang', NormalBalance::Kredit],
            '1-10103' => 'Piutang Karyawan',
        ],
    ],

    'Persediaan' => [
        'group' => AccountGroup::AsetLancar,
        'normal' => NormalBalance::Debit,
        'accounts' => [
            '1-10200' => 'Persediaan Bahan Baku KW',
            '1-10201' => 'Persediaan Bahan Baku Polos',
            '1-10202' => 'Persediaan Barang Dalam Proses (WIP)',
            '1-10203' => 'Persediaan Barang Jadi Tali',
            '1-10204' => 'Persediaan Lain',
            '1-10205' => 'Persediaan Sparepart',
        ],
    ],

    'Aktiva Lancar Lainnya' => [
        'group' => AccountGroup::AsetLancar,
        'normal' => NormalBalance::Debit,
        'accounts' => [
            '1-10300' => 'Uang Muka Pembelian',
            '1-10301' => 'Biaya Dibayar Dimuka',
            '1-10302' => 'PPN Masukan',
            '1-10303' => 'PPN Lebih Bayar',
            '1-10304' => 'PPh 22 Dibayar Dimuka',
            '1-10305' => 'PPh 23 Dibayar Dimuka',
            '1-10306' => 'PPh 25 Dibayar Dimuka',
        ],
    ],

    'Aset Tetap' => [
        'group' => AccountGroup::AsetTidakLancar,
        'normal' => NormalBalance::Debit,
        'accounts' => [
            '1-20000' => 'Tanah',
            '1-20001' => 'Bangunan Pabrik',
            '1-20002' => 'Gudang',
            '1-20003' => 'Kendaraan Ops',
            '1-20004' => 'Mesin Biji',
            '1-20005' => 'Mesin Tali',
            '1-20006' => 'Mesin Lain-lain',
            '1-20007' => 'Peralatan Produksi',
            '1-20008' => 'Peralatan Kantor',
        ],
    ],

    'Akumulasi Penyusutan' => [
        'group' => AccountGroup::KontraAset,
        'normal' => NormalBalance::Kredit,
        'accounts' => [
            '1-21001' => 'Akumulasi Penyusutan Bangunan Pabrik',
            '1-21002' => 'Akumulasi Penyusutan Gudang Produksi',
            '1-21003' => 'Akumulasi Penyusutan Kendaraan Ops',
            '1-21004' => 'Akumulasi Penyusutan Mesin Biji',
            '1-21005' => 'Akumulasi Penyusutan Mesin Tali',
            '1-21006' => 'Akumulasi Penyusutan Mesin Lain-lain',
            '1-21008' => 'Akumulasi Penyusutan Peralatan Produksi',
            '1-21009' => 'Akumulasi Penyusutan Peralatan Kantor',
            '1-21010' => 'Akumulasi Amortisasi Software',
        ],
    ],

    'Kewajiban Lancar' => [
        'group' => AccountGroup::Liabilitas,
        'normal' => NormalBalance::Kredit,
        'accounts' => [
            '2-10000' => 'Hutang Usaha',
            '2-10001' => 'Hutang Supplier Karung',
            '2-10002' => 'Hutang Supplier Bahan Pendukung',
            '2-10003' => 'Hutang Gaji',
            '2-10004' => 'Hutang Bonus',
            '2-10005' => 'Hutang Investor',
            '2-10006' => 'Biaya Masih Harus Dibayar',
            '2-10007' => 'Pendapatan Diterima Dimuka',
            '2-10100' => 'PPN Keluaran',
            '2-10101' => 'Hutang PPh 21',
            '2-10102' => 'Hutang PPh 22',
            '2-10103' => 'Hutang PPh 23',
            '2-10104' => 'Hutang PPh 25',
            '2-10105' => 'Hutang PPh 29',
            '2-10106' => 'Hutang PPh Final',
        ],
    ],

    'Kewajiban Jangka Panjang' => [
        'group' => AccountGroup::Liabilitas,
        'normal' => NormalBalance::Kredit,
        'accounts' => [
            '2-20000' => 'Hutang Bank',
            '2-20001' => 'Hutang Leasing',
            '2-20002' => 'Hutang Pemegang Saham',
            '2-20003' => 'Liabilitas Imbalan Kerja',
        ],
    ],

    'Ekuitas' => [
        'group' => AccountGroup::Ekuitas,
        'normal' => NormalBalance::Kredit,
        'accounts' => [
            '3-10000' => 'Modal Disetor',
            '3-10001' => 'Tambahan Modal Disetor',
            '3-10002' => 'Laba Ditahan',
            '3-10003' => 'Selisih Revaluasi',
            '3-10004' => ['Dividen', NormalBalance::Debit],
            '3-10005' => 'Pendapatan Periode Ini',
            '3-10006' => 'Saldo Penyesuaian Awal Ekuitas',
        ],
    ],

    'Pendapatan' => [
        'group' => AccountGroup::Pendapatan,
        'normal' => NormalBalance::Kredit,
        'accounts' => [
            '4-10000' => 'Penjualan Tali',
            '4-10001' => 'Penjualan Biji Plastik',
            '4-10002' => 'Penjualan Lain-Lain',
            '4-10003' => ['Retur Penjualan', NormalBalance::Debit],
            '4-10004' => ['Potongan Penjualan', NormalBalance::Debit],
        ],
    ],

    'HPP Produksi' => [
        'group' => AccountGroup::Hpp,
        'normal' => NormalBalance::Debit,
        'accounts' => [
            '5-10000' => 'Pemakaian Bahan Baku Polos',
            '5-10001' => 'Pemakaian Bahan Baku KW',
            '5-10002' => 'Pemakaian Bahan Pendukung',
            '5-11000' => 'Gaji Operator Produksi',
            '5-11001' => 'Lembur Borongan Produksi',
            '5-11002' => 'Gaji Supervisor Produksi',
            '5-11003' => 'Listrik Produksi',
            '5-11004' => 'Pelumas Mesin',
            '5-11005' => 'Sparepart Mesin',
            '5-11006' => 'Jasa Maintenance Mesin',
            '5-11007' => 'Beban Penyusutan Mesin Produksi',
            '5-11008' => 'Beban Penyusutan Bangunan Pabrik',
            '5-11010' => 'Perlengkapan Produksi',
            '5-11011' => 'Biaya Timbang, QC, Uang Jalan',
            '5-11012' => 'Waste Produksi',
            '5-11013' => 'Overhead Lain',
        ],
    ],

    'Beban Operasional' => [
        'group' => AccountGroup::Beban,
        'normal' => NormalBalance::Debit,
        'accounts' => [
            '6-10000' => 'Gaji Direksi',
            '6-10001' => 'Gaji Staff',
            '6-10002' => 'Gaji Tim Lapang',
            '6-10003' => 'THR & Bonus',
            '6-10004' => 'BPJS',
            '6-10005' => 'ATK',
            '6-10006' => 'Internet',
            '6-10007' => 'Konsumsi',
            '6-10008' => 'Keamanan',
            '6-10009' => 'Kebersihan',
            '6-10010' => 'Legal/Audit',
            '6-10011' => 'Perizinan',
            '6-10012' => 'Admin Bank',
            '6-20000' => 'Sewa Lahan Produksi Biji',
            '6-20001' => 'Sewa Lahan Produksi Tali',
            '6-20002' => 'Maintenance Bangunan Pabrik',
            '6-20003' => 'Maintenance dan Part Kendaraan Ops',
            '6-20004' => 'Beban Penyusutan Kendaraan Ops',
            '6-20005' => 'Beban Penyusutan Peralatan Produksi',
            '6-20006' => 'Beban Penyusutan Peralatan Kantor',
            '6-30000' => 'Iklan dan Promosi',
            '6-30001' => 'Bonus Sales',
            '6-30002' => 'Beban Transport Penjualan',
            '6-30003' => 'Entertainment Customer/Supplier',
            '6-30004' => 'Pengeluaran Lainnya',
        ],
    ],

    'Pendapatan Lainnya' => [
        'group' => AccountGroup::PendapatanLain,
        'normal' => NormalBalance::Kredit,
        'accounts' => [
            '7-10000' => 'Pendapatan Bunga',
            '7-10001' => 'Pendapatan Selisih Kurs',
            '7-10099' => 'Pendapatan Lain-lain',
        ],
    ],

    'Beban Lainnya' => [
        'group' => AccountGroup::BebanLain,
        'normal' => NormalBalance::Debit,
        'accounts' => [
            '8-10000' => 'Beban Bunga',
            '8-10001' => 'Rugi Selisih Kurs',
            '8-10002' => 'Rugi Pelepasan Aset',
            '8-10003' => 'Penyesuaian Persediaan',
            '8-10099' => 'Beban Lain-lain',
        ],
    ],

    'Beban Pajak' => [
        'group' => AccountGroup::Pajak,
        'normal' => NormalBalance::Debit,
        'accounts' => [
            '9-10000' => 'Beban Pajak Kini',
            '9-10001' => 'Beban Pajak Tangguhan',
            '9-10002' => 'Koreksi Pajak',
        ],
    ],
];
