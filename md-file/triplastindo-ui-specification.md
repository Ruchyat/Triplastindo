# Triplastindo Finance — UI Specification

> Spesifikasi pembuatan **UI web app Finance Triplastindo** berdasarkan kondisi dan struktur modul pada dokumen `triplastindo-finance-webapp.md`.
>
> **Status per 18 September 2026:** seluruh halaman sudah dibuat. Penjualan,
> Penerimaan Pembayaran, Deposit Pelanggan, Pembelian, dan Jurnal Umum sudah
> tersambung ke database; sisanya masih membaca mock data.
>
> Beberapa bagian dokumen ini **sudah didahului keadaan sebenarnya** — bentuk
> beberapa halaman berubah setelah dipakai dan ditinjau. Bagian yang berubah
> ditandai di tempatnya masing-masing. Sumber paling mutakhir adalah
> `triplastindo-kontrak-api.md` untuk bentuk data dan
> `triplastindo-catatan-keputusan-proyek.md` untuk alasan setiap perubahan.
>
> Frontend:
> - Vite, React 19, TypeScript
> - Tailwind CSS v4
> - React Router, Recharts, lucide-react
> - Komponen dibangun sendiri, tidak memakai shadcn/ui
>
> Backend:
> - Laravel 13, PHP 8.5
> - MySQL
> - Laravel Sanctum, autentikasi token Bearer

---

# 1. Tujuan Tahap UI

Tahap ini bertujuan membuat seluruh tampilan utama aplikasi Finance Triplastindo agar:

1. Struktur menu sudah sesuai dengan sistem finance yang sekarang.
2. Semua halaman utama sudah memiliki layout yang konsisten.
3. Semua tabel, card, filter, form, dialog, badge, dan komponen laporan sudah tersedia secara visual.
4. Data menggunakan **dummy/mock data**.
5. Belum ada koneksi ke backend.
6. Belum ada implementasi formula akuntansi.
7. Struktur frontend disiapkan agar mudah dihubungkan ke Laravel REST API nantinya.

---

# 2. Prinsip Desain

Aplikasi ini adalah aplikasi finance/accounting internal perusahaan.

Karakter desain:

- Profesional.
- Bersih.
- Corporate.
- Fokus pada keterbacaan angka dan tabel.
- Tidak menggunakan desain futuristik.
- Tidak menggunakan glassmorphism atau glow berlebihan.
- Desktop-first karena mayoritas halaman berisi tabel dan laporan.
- Tetap responsive untuk tablet dan mobile.
- Layout laporan harus nyaman untuk dicetak ke A4.

Warna yang disarankan:

- Background aplikasi: `slate-50`
- Sidebar: putih / `slate-950` tergantung tema
- Primary: biru tua
- Success: hijau
- Warning: amber
- Danger: merah
- Muted: slate
- Border tabel: abu-abu ringan

Gunakan typography sans-serif modern seperti:

- Inter
- Geist
- Plus Jakarta Sans

---

# 3. Struktur Aplikasi

## 3.1 Layout Utama

Gunakan layout:

```text
┌───────────────────────────────────────────────────────────┐
│ Sidebar │ Topbar                                          │
│         ├─────────────────────────────────────────────────┤
│         │ Page Header                                     │
│         │                                                 │
│         │ Content                                         │
│         │                                                 │
│         │                                                 │
└───────────────────────────────────────────────────────────┘
```

Komponen layout:

- `AppSidebar`
- `Topbar`
- `PageHeader`
- `Breadcrumb`
- `ContentContainer`

Desktop:

- Sidebar fixed kiri.
- Lebar sekitar 250–280px.
- Content memakai ruang yang tersisa.

Tablet/mobile:

- Sidebar berubah menjadi drawer / sheet.
- Tabel boleh horizontal scroll.

---

# 4. Sidebar / Menu Utama

Menu mengikuti modul yang sudah ada pada dokumen Triplastindo.

## Overview

### 1. Dashboard

Icon rekomendasi:

`LayoutDashboard`

Route:

```text
/dashboard
```

---

## Laporan

### 2. Laporan Laba Rugi

Icon:

`ChartNoAxesCombined`

Route:

```text
/reports/profit-loss
```

### 3. Laporan Neraca

Icon:

`Scale`

Route:

```text
/reports/balance-sheet
```

### 4. Laporan Arus Kas

Icon:

`ArrowLeftRight`

Route:

```text
/reports/cash-flow
```

### 5. Buku Besar

Icon:

`BookOpen`

Route:

```text
/general-ledger
```

---

## Transaksi

> Kelompok ini mengikuti pendekatan **transaction-first**. Pengguna mencatat kejadian
> bisnis; sistem yang membentuk jurnal double-entry. Menu "Input Transaksi" yang meminta
> akun debit dan kredit sudah tidak dipakai.

### 6. Penjualan

Icon: `Store` · Route: `/sales`

Tiga tab: Invoice Penjualan, Penerimaan Pembayaran, dan Deposit Pelanggan.

### 7. Pembelian

Icon: `ShoppingCart` · Route: `/purchases`

Tagihan pembelian untuk semua kategori. Kategorinya yang menentukan akun mana
yang dipakai jurnalnya. Kategori Aset Tetap belum tersedia, menunggu modul Aset.

### 8. Pengeluaran

Icon: `CircleDollarSign` · Route: `/expenses`

Biaya yang tidak melalui proses pembelian barang.

### 9. Kas & Bank

Icon: `Banknote` · Route: `/cash-bank`

Penerimaan piutang, pembayaran utang, transfer antar akun, dan mutasi saldo.

### 10. Jurnal Manual

Icon: `NotebookPen` · Route: `/transactions/manual-journal`

Khusus jurnal penyesuaian, koreksi, reklasifikasi, dan jurnal penutup. Bukan jalur
utama pencatatan transaksi.

### 11. Jurnal Umum

Icon: `NotebookTabs` · Route: `/journals`

---

## Keuangan

### 12. Utang

Icon: `HandCoins` · Route: `/payables`

Sub-ledger. Kartu utang terbentuk otomatis dari tagihan pembelian kredit, tidak diinput manual.

### 13. Piutang

Icon: `WalletCards` · Route: `/receivables`

Sub-ledger, beserta kartu umur piutang. Terbentuk otomatis dari invoice penjualan kredit.

### 14. Deposit Pelanggan

Icon: `CircleDollarSign` · Route: `/customer-deposits`

Uang titipan customer yang dapat diterima tanpa invoice. Dicatat sebagai kewajiban.

> **Berubah 18 September 2026.** Halamannya menampilkan **daftar customer**,
> bukan daftar mutasi. Saldo deposit adalah pertanyaan per customer — "si A
> masih punya titipan berapa" — bukan per tanggal; bentuk buku mutasi memaksa
> pembaca menjumlah sendiri.
>
> Kolomnya: Customer, Mutasi Terakhir, Deposit Masuk, Terpakai, Dikembalikan,
> Saldo. Keempat angkanya lengkap agar barisnya dapat dijumlah sendiri.
> Mengklik satu baris membuka **kartu deposit customer itu** pada halaman
> tersendiri, berisi saldo, riwayat mutasi dengan saldo berjalan, dan tautan ke
> jurnal serta invoice terkait.

### 15. Customer

Icon: `Store` · Route: `/customers`

Monitoring penjualan, pembayaran, piutang, dan deposit per customer.

### 16. Supplier

Icon: `Truck` · Route: `/suppliers`

Monitoring pembelian, pembayaran, dan utang per supplier.

### 17. Bagi Hasil

Icon: `BadgeDollarSign` · Route: `/profit-sharing`

---

## Operasional

### 18. Summary Inventory & Penjualan

Icon: `Boxes` · Route: `/inventory-summary`

> Inventory masih mengikuti struktur summary yang ada. Belum ada engine inventory terintegrasi.

### 19. Aset & Depresiasi

Icon: `Factory` · Route: `/assets`

---

## Payroll

### 20. Gaji Karyawan

Icon: `UsersRound` · Route: `/payroll`

### 21. Slip Gaji

Icon: `ReceiptText` · Route: `/payslips`

---

## Sistem

### 22. Setup

Icon: `Settings` · Route: `/setup`

Tab master data:

- Chart of Accounts
- Customer
- Supplier
- Produk & Item
- Master Aset
- Master Karyawan
- Pemegang Saham
- Jenis Pembayaran
- Tahun Buku / Periode
- Profil Perusahaan
- Parameter

---

# 4a. Halaman Login

Route: `/login`

Satu-satunya halaman yang dapat diakses tanpa sesi. Seluruh route lain dijaga
`RequireAuth`; pengunjung tanpa sesi diarahkan ke sini, dan setelah berhasil masuk
dikembalikan ke alamat yang tadi dituju.

Layout dua kolom pada layar lebar:

- Kiri: panel identitas perusahaan berlatar `#102a43`. Disembunyikan di bawah `lg`.
- Kanan: form email dan kata sandi.

Ketentuan:

- Tombol nonaktif selama proses kirim dan selama email atau kata sandi masih kosong.
- Galat dari API ditampilkan sebagai satu kotak peringatan di atas form.
- Tersedia tombol tampilkan/sembunyikan kata sandi.
- Selama token tersimpan masih diverifikasi ke server, tampilkan layar "Memeriksa sesi"
  agar pengguna dengan sesi sah tidak sempat terlempar ke halaman login saat memuat ulang.

---

# 5. Topbar

Topbar minimal berisi:

### Kiri

- Tombol sidebar collapse.
- Breadcrumb.
- Nama halaman.

### Kanan

- Periode aktif.
- Notification button.
- Avatar user.
- Dropdown user.

Dropdown user:

- Profile
- Account
- Logout

Contoh:

```text
Periode Aktif: September 2026
```

---

# 6. Dashboard

Route:

```text
/dashboard
```

Dashboard mengikuti data dan widget yang sudah tercantum di dokumen.

## 6.1 Header

```text
Dashboard
Ringkasan kondisi keuangan Triplastindo
```

Filter:

- Bulan
- YTD
- Tahun

Contoh:

```text
September 2026
```

---

## 6.2 KPI Cards

Empat card utama:

### Total Revenue

Tampilkan:

- Nilai Rupiah.
- Persentase Asset Turnover.
- Perubahan dibanding bulan sebelumnya.

### Total Expenses

Tampilkan:

- Nilai Rupiah.
- Persentase terhadap pendapatan.
- Indikator naik/turun.

### Net Profit

Tampilkan:

- Nilai Rupiah.
- Net Profit Margin.
- Perubahan bulan sebelumnya.

### Saldo Kas Usaha

Tampilkan:

- Saldo saat ini.
- Text:

```text
Per 17 September 2026
```

---

## 6.3 Rasio Keuangan

Card:

```text
Rasio Keuangan YTD
```

Tampilkan:

- Current Ratio
- Gross Profit Margin
- Net Profit Margin
- Debt to Equity Ratio
- Cashflow to Revenue

Gunakan:

- badge hijau untuk status Good
- badge merah untuk status Bad

Contoh:

```text
Current Ratio
1.42
Good
```

---

## 6.4 Ringkasan Arus Kas

Card dengan empat nilai:

- Saldo Awal
- Uang Masuk
- Uang Keluar
- Saldo Akhir

---

## 6.5 Grafik Keuangan

Judul:

```text
Overview Keuangan Full Year
```

Chart:

- Pendapatan
- Pengeluaran
- Laba Rugi

X-axis:

```text
Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des
```

Library chart dapat menggunakan:

- Recharts

---

## 6.6 Net Profit Current vs Last Month

Card perbandingan:

```text
September
Rp xxx

vs

Agustus
Rp xxx
```

Tampilkan:

- nominal
- persentase perubahan

---

## 6.7 Realisasi Utang

Donut chart.

Tampilkan:

- Total Utang
- Terbayar
- Outstanding
- % Paid Payable

---

## 6.8 Realisasi Piutang

Donut chart.

Tampilkan:

- Total Piutang
- Terbayarkan
- Belum Tertagih
- Collection %

---

## 6.9 Saldo Kas & Bank

Table/card:

| Akun | Saldo |
|---|---:|
| Kas | Rp ... |
| Petty Cash | Rp ... |
| Bank BCA | Rp ... |
| Bank BNI | Rp ... |
| Bank BRI | Rp ... |
| Giro | Rp ... |
| Cash Advance | Rp ... |

---

# 7. Jurnal Manual

Route:

```text
/transactions/manual-journal
```

> Halaman ini **bukan** jalur utama pencatatan. Transaksi bisnis dicatat lewat menu
> Penjualan, Pembelian, Pengeluaran, dan Kas & Bank. Jurnal Manual hanya untuk jurnal
> penyesuaian, koreksi akuntansi, reklasifikasi akun, dan jurnal penutup oleh Finance.
>
> Tampilkan catatan penjelas itu di bagian atas halaman agar pengguna tidak salah masuk.

Gunakan tabs:

```text
Jurnal Sederhana
Jurnal Majemuk
```

## 7.1 Jurnal Sederhana

Form:

- Tanggal
- Jenis Pembayaran
- Akun Debit
- Akun Kredit
- Nominal
- Referensi
- Keterangan
- No. Hutang
- No. Piutang
- Upload Bukti

Card **Preview Jurnal** di sampingnya:

| Akun | Debit | Kredit |
|---|---:|---:|
| Bank BCA | Rp 10.000.000 | – |
| Penjualan Tali | – | Rp 10.000.000 |
| **Selisih** | | **Rp 0** |

Indikator `Balance` ditampilkan pada kop card.

## 7.2 Jurnal Majemuk

Header: Tanggal, Jenis Pembayaran, Keterangan.

Table editable:

| Akun | Keterangan | Debit | Kredit | |
|---|---|---:|---:|---|
| ... | ... | ... | ... | Hapus |

Tombol `+ Tambah Baris`.

Footer menampilkan Total Debit, Total Kredit, dan Selisih. **Tombol simpan nonaktif
selama selisih belum nol** — jurnal tidak seimbang tidak boleh tersimpan.

---

# 7a. Halaman Transaksi Bisnis

> **Berubah 18 September 2026.** Rancangan semula memakai satu panel geser
> (`TransactionDrawer`) untuk seluruh jenis dokumen. Form dan detail dokumen
> kini berupa **halaman penuh** dengan alamatnya sendiri — panel menghapus
> isian hanya karena satu klik di luarnya, tidak punya alamat sehingga refresh
> membuang isian, dan lebarnya mengunci jumlah kolom tabel item.
>
> `TransactionDrawer` masih melayani Pengeluaran dan Kas & Bank, yang datanya
> belum tersambung.

Alamat halaman dokumen:

```text
/sales/invoices/new        /sales/invoices/:id
/sales/receipts/new        /sales/receipts/:id
/customer-deposits/new     /customer-deposits/:customerId
/purchases/bills/new       /purchases/bills/:id
```

Meninggalkan halaman form yang isiannya belum tersimpan memunculkan konfirmasi,
begitu pula menutup tab atau menekan refresh.

## Penjualan — `/sales`

Tiga tab: **Invoice Penjualan**, **Penerimaan Pembayaran**, dan **Deposit Pelanggan**.

KPI: Total penjualan, DP & pembayaran diterima, Piutang terbuka, Invoice jatuh tempo.

Tabel invoice: No. Invoice, Tanggal, Customer, Produk, Qty, Total, Diterima, Sisa, Status.

Form invoice:

- Metode pembayaran hanya **Tunai** dan **Piutang**. Kas dan bank tidak dipisah
  sebagai metode — rekening penerimanya sudah dipilih tersendiri lewat dropdown
  akun Kas & Bank, sehingga memisahkannya menanyakan hal yang sama dua kali.
- Termin dan jatuh tempo hanya muncul bila metodenya Piutang.
- Saldo deposit customer ditampilkan dengan **checkbox**, bukan dipotong
  otomatis: ada customer yang ingin depositnya tetap utuh. Berlaku untuk kedua
  metode.
- Akun penerima hanya wajib bila ada uang yang benar-benar masuk. Invoice tunai
  yang seluruhnya tertutup deposit tidak memindahkan uang sama sekali.
- Kolom PPN Keluaran tersedia.

## Pembelian — `/purchases`

Satu menu untuk semua kategori. **Kategori pembelian menentukan akun** mana
yang didebit dan akun utang mana yang dipakai — pemetaannya ada di konfigurasi
backend, dan formnya menampilkan akun tujuannya sebelum tagihan disimpan.

Bentuk baris item mengikuti kategori: kategori persediaan meminta produk pada
tiap baris, kategori beban cukup keterangan.

Metode pembayaran hanya **Tunai** dan **Utang**. Kategori Aset Tetap belum
tersedia, menunggu modul Aset.

## Pengeluaran — `/expenses`

Biaya yang tidak melalui pembelian barang. Kolom: No. Bukti, Tanggal, Kategori Biaya,
Penerima, Nominal, Akun Pembayaran, Status.

## Kas & Bank — `/cash-bank`

Tiga kartu aksi di bagian atas: **Terima Pembayaran**, **Bayar Tagihan**,
**Transfer Antar Akun**. Pembayaran wajib ditautkan ke invoice atau tagihan asalnya.

Tabel mutasi: Tanggal, Akun, Jenis, Lawan Transaksi, Referensi, Masuk, Keluar.

---

# 8. Jurnal Umum

Route:

```text
/journals
```

## Filter

- Rentang tanggal
- Bulan
- Akun
- Kategori
- Tagging transaksi
- Keyword

Button:

- Export Excel
- CSV
- Print

## Tabel

> **Berubah 18 September 2026.** Percobaan pertama menggabungkan satu transaksi
> menjadi satu baris dengan kolom Debit berisi totalnya — jurnal tiga baris jadi
> terbaca seperti jurnal dua baris. Sekarang **satu baris tabel adalah satu sisi
> debit atau kredit**, sama seperti tab JURNAL UMUM di Google Sheet.

| No. Bukti | Tanggal | COA | Nama Akun | Kategori Akun | Keterangan | Debit | Kredit |
|---|---|---|---|---|---|---:|---:|

Nomor bukti dan tanggal ditulis sekali di baris pertama tiap transaksi lalu
dikosongkan di bawahnya; garis tebal menandai pergantian transaksi. Tidak ada
baris kepala transaksi — ia memecah tabel menjadi dua jenis baris dan memaksa
mata berpindah-pindah saat menyisir data.

Nomor dokumen asal (`INV/…`, `PUR/…`, `BKM/…`, `DEP/…`) ditampilkan di bawah
nomor bukti sebagai tautan ke halaman dokumennya — itu yang paling sering
dicocokkan saat pemeriksaan, sehingga tidak pantas menuntut satu klik.

### Detail transaksi

Mengklik baris membuka **accordion** di bawah transaksinya, bukan panel samping:
panel menutupi tabel dan membuat pemeriksa kehilangan posisi barisnya saat
menyisir banyak data. Isinya satu baris ringkas — keterangan transaksi, sumber,
metode pembayaran, pembuat, total, dan tagging.

Lampiran dan audit history belum ada.

---

# 9. Buku Besar

Route:

```text
/general-ledger
```

Header filter:

- Pilih Akun
- Bulan
- Date range

Summary:

- Saldo Awal
- Total Debit
- Total Kredit
- Saldo Akhir

Tabel:

| No | Tanggal | Deskripsi | Debit | Kredit | Balance |
|---|---|---|---:|---:|---:|

Tambahkan:

```text
Bandingkan Akun
```

untuk membuka multi-panel akun.

---

# 10. Laporan Laba Rugi

Route:

```text
/reports/profit-loss
```

Header:

```text
TRIPLASTINDO
LAPORAN LABA RUGI
Periode yang berakhir ...
Dalam IDR
```

Filter:

- Bulan
- Tahun
- YTD

Actions:

- Print
- Export PDF
- Export Excel

## Struktur tabel

```text
PENDAPATAN
  Penjualan Tali
  Penjualan Biji Plastik
  Penjualan Lain-lain
  Retur Penjualan
  Potongan Penjualan

TOTAL PENDAPATAN

HPP PRODUKSI
...

LABA KOTOR

BEBAN OPERASIONAL
...

LABA OPERASIONAL

PENDAPATAN LAINNYA

BEBAN LAINNYA

LABA SEBELUM PAJAK

BEBAN PAJAK

LABA BERSIH
```

Kolom:

| Akun | Nominal | % Revenue |
|---|---:|---:|

Mode YTD:

| Akun | YTD | Jan | Feb | ... | Des |
|---|---:|---:|---:|---|---:|

---

# 11. HPP per Kg

Tetap menjadi bagian dari halaman Laba Rugi atau subtab:

```text
Laba Rugi
HPP per Kg
```

Input UI:

- Total Belanja Bahan Baku Kg
- Total Belanja Bahan Baku Rp
- Produksi Biji Kg
- Produksi Tali Kg
- Harga Jual per Kg

Summary:

- Avg Harga Beli/kg
- HPP Komponen/kg
- Biaya Operasional/kg
- Total HPP/kg
- Rasio HPP terhadap Harga Jual

---

# 12. Laporan Neraca

Route:

```text
/reports/balance-sheet
```

Header laporan sama dengan Laba Rugi.

Struktur:

```text
ASET

ASET LANCAR
  Kas & Bank
  Piutang
  Persediaan
  Aktiva Lancar Lainnya

ASET TETAP
  Harga Perolehan
  Akumulasi Penyusutan

TOTAL ASET

LIABILITAS

KEWAJIBAN LANCAR

KEWAJIBAN JANGKA PANJANG

TOTAL LIABILITAS

EKUITAS

TOTAL EKUITAS

TOTAL LIABILITAS + EKUITAS
```

Tambahkan indicator:

```text
NERACA BALANCE
```

atau

```text
SELISIH Rp ...
```

---

## 12.1 Rasio Keuangan

Table:

| Rasio | Nilai | Standar | Status |
|---|---:|---:|---|
| Current Ratio | | | |
| Quick Ratio | | | |
| Gross Profit Margin | | | |
| Net Profit Margin | | | |
| Debt to Equity | | | |
| Cashflow to Revenue | | | |
| Asset Turnover | | - | Info |

---

# 13. Laporan Arus Kas

Route:

```text
/reports/cash-flow
```

Struktur:

```text
A. AKTIVITAS OPERASI
Penerimaan Kas dari Pelanggan
Pembayaran atas Beban Usaha

ARUS KAS BERSIH OPERASI

B. AKTIVITAS INVESTASI
Pembelian Aset Tetap
Penjualan Aset Tetap

ARUS KAS BERSIH INVESTASI

C. AKTIVITAS PENDANAAN
Modal Disetor
Tambahan Modal
Dividen
Penerimaan Pinjaman
Pembayaran Pinjaman

ARUS KAS BERSIH PENDANAAN

SALDO KAS AWAL
KENAIKAN / PENURUNAN KAS
SALDO KAS AKHIR
```

Tambahkan reconciliation card:

```text
Saldo Kas menurut Arus Kas
Saldo Kas menurut Neraca
Selisih
```

---

# 14. Utang

Route:

```text
/payables
```

## KPI

- Total Utang
- Terbayar
- Outstanding
- % Terbayar

## Filter

- Kreditur
- Status
- Jatuh tempo
- Bulan

Button:

```text
+ Buat Utang
```

## Tabel

| No Hutang | Kreditur | Tanggal | Jatuh Tempo | Nominal | Dibayar | Sisa | Status |
|---|---|---|---|---:|---:|---:|---|

Status badge:

- Belum Bayar
- Sebagian
- Lunas
- Jatuh Tempo

Detail dapat menggunakan drawer.

Actions:

- Lihat
- Bayar
- Edit

---

# 15. Piutang

Route:

```text
/receivables
```

Layout mengikuti Utang.

KPI:

- Total Piutang
- Terbayarkan
- Belum Tertagih
- Collection %

Tambahkan aging cards:

- 0–30 hari
- 31–60 hari
- 61–90 hari
- >90 hari

---

# 16. Summary Inventory & Penjualan

Route:

```text
/inventory-summary
```

Pada tahap pertama UI mengikuti summary existing, tanpa membuat inventory engine baru.

Tabs:

```text
Biji Plastik / WIP
Tali
Inventory Lain
```

## Penjualan per Bulan

| Bulan | Qty Kg | Penjualan | Omset | Omset - HPP |
|---|---:|---:|---:|---:|

## Persediaan

| Bulan | Qty In | Qty Out | Qty Sisa |
|---|---:|---:|---:|

## Nilai Persediaan

| Bulan | Nominal |
|---|---:|

Tambahkan chart:

- Tren Stok
- Tren Penjualan

---

# 17. Gaji Karyawan

Route:

```text
/payroll
```

Header:

```text
Payroll
Kelola gaji karyawan Triplastindo
```

Filter:

- Periode
- Karyawan
- Departemen

Button:

```text
+ Buat Payroll
```

KPI:

- Total Gaji Kotor
- Total Potongan
- Total THP
- Jumlah Karyawan

Table:

| Karyawan | Status | Gaji Pokok | Lembur | Allowance | Bonus | Potongan | THP |
|---|---|---:|---:|---:|---:|---:|---:|

---

# 18. Slip Gaji

Route:

```text
/payslips
```

Filter:

- Karyawan
- Periode

Actions:

- Preview
- Print
- Download PDF
- Cetak Massal

Preview slip dibuat dalam A4 card.

Struktur:

```text
TRIPLASTINDO

SLIP GAJI

Nama
NIK
Departemen / Posisi
Tanggal

PENDAPATAN
Gaji Pokok
Lembur
Allowance
Tunjangan / Bonus

POTONGAN
PPh 21
BPJS TK
BPJS Kesehatan
Potongan Kasbon

TOTAL PENDAPATAN
TOTAL POTONGAN

THP
```

---

# 19. Aset & Depresiasi

Route:

```text
/assets
```

Tabs:

```text
Daftar Aset
Depresiasi
```

## Daftar Aset

KPI:

- Total Nilai Aset
- Akumulasi Depresiasi
- Nilai Buku

Button:

```text
+ Tambah Aset
```

Table:

| Kode | Aset | Jenis | Tgl Beli | Nilai | Umur | Depresiasi/Bulan | Nilai Buku |
|---|---|---|---|---:|---:|---:|---:|

---

## Depresiasi

Card:

```text
Depresiasi September 2026
```

Table:

| Jenis Aset | Nilai Aset | Beban Depresiasi |
|---|---:|---:|

Action:

```text
Preview Jurnal Depresiasi
```

Pada tahap UI tombol belum menjalankan posting.

---

# 20. Bagi Hasil

Route:

```text
/profit-sharing
```

Tabs:

```text
Keputusan Pembagian
Pemegang Saham
Riwayat Dividen
```

## Keputusan Pembagian

Card:

- Saldo Kas Akhir
- Minimum Cash
- Check Point
- Laba Bersih
- Laba Ditahan
- Laba Dibagikan
- DPR

Status:

```text
Aman
Tidak Aman
```

Form:

- Periode
- Total Dividen
- Tanggal Keputusan

## Alokasi Dividen

| Pemegang Saham | Jumlah Saham | Share | Bruto | Pajak | Net |
|---|---:|---:|---:|---:|---:|

Approval status:

- Draft
- Menunggu Approval
- Approved
- Rejected

---

# 21. Setup

Route:

```text
/setup
```

Gunakan layout settings dengan sidebar/tab internal.

---

## 21.1 Chart of Accounts

Table:

| Kode | Nama Akun | Kategori | Saldo Normal | Status |
|---|---|---|---|---|

Actions:

- Tambah
- Edit
- Nonaktifkan

Button:

```text
Muat COA Default Triplastindo
```

---

## 21.2 Master Aset

Table:

| Kode | Nama | Jenis |
|---|---|---|

---

## 21.3 Master Karyawan

Table:

| NIK | Nama | Departemen | Posisi | Status | Aktif |
|---|---|---|---|---|---|

---

## 21.4 Pemegang Saham

Table:

| Nama | Jumlah Saham | Persentase |
|---|---:|---:|

---

## 21.5 Jenis Pembayaran

Default:

- Cash
- Transfer Antar Bank
- Transfer Sesama Bank
- E-Wallet
- Kredit
- Payroll
- VA

---

## 21.6 Tahun Buku / Periode

Calendar/grid 12 bulan:

```text
Januari     Open
Februari    Open
Maret       Closed
...
```

Badge:

- Open
- Closed

---

## 21.7 Profil Perusahaan

Fields:

- Nama perusahaan
- Alamat
- Email
- Website
- Logo

---

## 21.8 Parameter

Fields:

- Minimum Cash
- Pajak Dividen %
- Nilai Residu Aset %
- Standard Current Ratio
- Standard Quick Ratio
- Standard GPM
- Standard NPM
- Standard DER
- Standard CFR

---

# 22. Komponen Global

Buat reusable component sejak tahap UI.

## Layout

```text
AppSidebar
Topbar
PageHeader
PageContainer
```

## Data Display

```text
StatCard
MoneyValue
PercentageBadge
StatusBadge
ReportTable
DataTable
EmptyState
```

## Filters

```text
MonthSelect
YearSelect
DateRangePicker
AccountSelect
SearchInput
```

## Financial

```text
CurrencyInput
AccountCombobox
JournalPreview
BalanceIndicator
RatioStatus
```

## Dialog

```text
ConfirmDialog
FormDialog
DetailDrawer
```

---

# 23. Format Data UI

## Currency

```text
Rp 1.234.567
```

Negative:

```text
(Rp 17.460.000)
```

Jangan tampilkan:

```text
-Rp 17.460.000
```

untuk laporan keuangan.

---

## Percentage

```text
26,0%
```

---

## Date

```text
17 September 2026
```

atau pada laporan:

```text
Kamis, 17 September 2026
```

---

## Empty value

Gunakan:

```text
–
```

atau:

```text
Rp 0
```

sesuai konteks.

Jangan tampilkan:

```text
null
undefined
NaN
#DIV/0!
#N/A
#REF!
```

---

# 24. Responsive Rules

## Desktop

Target utama:

```text
>= 1280px
```

Dashboard:

- 4 KPI dalam satu row.
- Widget 2–3 kolom.

Report:

- full width.

---

## Tablet

```text
768px – 1279px
```

- Sidebar collapsible.
- KPI 2 kolom.
- Tabel horizontal scroll.

---

## Mobile

```text
< 768px
```

- Sidebar drawer.
- KPI 1 kolom.
- Filter menggunakan Sheet.
- Tabel horizontal scroll.
- Report tidak perlu dipaksakan menjadi card per row.

---

# 25. Struktur Folder Frontend

Struktur yang dipakai saat ini. Setiap halaman berada pada berkas sendiri, dan
komponen khusus satu fitur diletakkan pada `components/` di dalam folder fitur itu.

```text
src/
│
├── app/
│   ├── providers/       AppProviders, AuthProvider dipasang di sini
│   └── router/          paths.ts, AppRouter, RequireAuth, lazyPages
│
├── components/
│   ├── ui/              Button, Drawer, TabSwitch
│   ├── layout/          AppSidebar, Topbar, UserMenu, navigation.ts
│   ├── common/          PageHeader, Card, MiniStat, Status, FilterBar, form, DataTable
│   ├── financial/       StatCard, ReportRow, JournalPreview, transaction-drawer/
│   └── charts/          FinancialTrendChart, StockTrendChart
│
├── features/
│   ├── auth/            LoginPage, AuthProvider, useAuth
│   ├── dashboard/       sales/  purchases/  expenses/  cash-bank/
│   ├── customer-deposits/  customers/  suppliers/
│   ├── transactions/    ManualJournalPage
│   ├── journals/  ledger/
│   ├── reports/         profit-loss/  balance-sheet/  cash-flow/
│   ├── payables/  receivables/  subledger/
│   ├── profit-sharing/  inventory/  assets/  payroll/  payslips/
│   └── setup/
│
├── layouts/             AppLayout
├── lib/                 cn.ts, format.ts
├── hooks/               useDisclosure
├── services/            httpClient, authService, tokenStorage
├── mocks/               data per domain, terpisah dari tampilan
└── types/               model bertipe per domain
```

Alias `@/` menunjuk ke `src/`, sehingga impor tidak perlu memakai `../../../`.

Aturan yang dijaga:

- Data tidak ditulis langsung di dalam JSX. Semuanya berada di `src/mocks`.
- Bentuk data mengikuti tipe di `src/types`, agar penggantian mock menjadi API tidak
  mengubah komponen.
- Komponen tidak memanggil `fetch` langsung, melainkan lewat `src/services`.

---

# 26. Routing

Contoh route React:

```text
/
├── dashboard
│
├── transactions
│   └── create
│
├── journals
│
├── general-ledger
│
├── reports
│   ├── profit-loss
│   ├── balance-sheet
│   └── cash-flow
│
├── payables
│
├── receivables
│
├── inventory-summary
│
├── payroll
│
├── payslips
│
├── assets
│
├── profit-sharing
│
└── setup
```

Gunakan React Router.

---

# 27. Mock Data

Seluruh halaman pada tahap UI memakai mock data.

Contoh:

```text
src/mocks/dashboard.ts
src/mocks/journals.ts
src/mocks/accounts.ts
src/mocks/payables.ts
src/mocks/receivables.ts
src/mocks/assets.ts
src/mocks/payroll.ts
```

Jangan hard-code puluhan data langsung di JSX.

Mock data nantinya cukup diganti oleh service API.

---

# 28. Shadcn Components

Komponen utama yang direkomendasikan:

- Button
- Card
- Table
- Tabs
- Select
- Input
- Textarea
- Label
- Badge
- Dialog
- Sheet
- Dropdown Menu
- Command
- Popover
- Calendar
- Tooltip
- Separator
- Skeleton
- Scroll Area
- Avatar
- Breadcrumb

Untuk tabel besar dapat menggunakan:

```text
TanStack Table
```

dengan styling Shadcn.

---

# 29. State UI yang Harus Disediakan

Setiap halaman data minimal memiliki:

### Loading

Gunakan skeleton.

### Empty

Contoh:

```text
Belum ada transaksi pada periode ini.
```

### Error

Contoh:

```text
Data tidak dapat dimuat.
```

### Normal

Tampilkan data.

Walaupun tahap UI memakai mock, visual state ini tetap dibuat.

---

# 30. Batas Tahap UI

Pada tahap ini **belum perlu dibuat**:

- Laravel API.
- Database.
- Authentication sebenarnya.
- Role permission sebenarnya.
- Posting jurnal.
- Perhitungan balance.
- Perhitungan laporan.
- Closing periode.
- Jurnal depresiasi otomatis.
- Kalkulasi pajak.
- Approval workflow sebenarnya.
- Upload file sebenarnya.
- Export PDF / Excel sebenarnya.
- Inventory engine.
- Integrasi bank.
- Notifikasi backend.

Button dan flow tersebut cukup dibuat secara visual.

Contoh:

```text
Simpan
Approve
Tutup Periode
Export PDF
Posting Depresiasi
```

boleh menampilkan toast dummy.

---

# 31. Prioritas Pembuatan UI

Urutan yang direkomendasikan:

## Tahap 1

- App Layout
- Sidebar
- Topbar
- Dashboard

## Tahap 2

- Penjualan, Pembelian, Pengeluaran, Kas & Bank
- Jurnal Manual
- Jurnal Umum
- Buku Besar

## Tahap 3

- Laporan Laba Rugi
- Neraca
- Arus Kas

## Tahap 4

- Utang
- Piutang

## Tahap 5

- Aset & Depresiasi
- Gaji Karyawan
- Slip Gaji

## Tahap 6

- Bagi Hasil
- Summary Inventory & Penjualan

## Tahap 7

- Setup
- Responsive polishing
- Print layout
- UI consistency review

---

# 32. Target Akhir Tahap UI

Tahap UI dianggap selesai ketika:

- Seluruh menu sudah dapat dinavigasi.
- Semua halaman memiliki layout final.
- Seluruh tabel utama sudah tersedia.
- Semua form utama sudah tersedia.
- Dashboard sudah mempunyai seluruh widget.
- Laporan sudah mempunyai tampilan bulanan dan YTD.
- Desktop, tablet, dan mobile dapat digunakan.
- Semua halaman menggunakan mock data.
- Tidak ada business logic yang harus dibuat ulang saat Laravel API mulai diintegrasikan.
- UI component dan feature structure sudah modular.

Setelah tahap ini selesai, pekerjaan berikutnya adalah:

```text
UI
↓
API Contract
↓
Database Schema
↓
Laravel Backend
↓
Integrasi React ↔ Laravel
↓
Business Logic Akuntansi
↓
QA dengan data spreadsheet
```
