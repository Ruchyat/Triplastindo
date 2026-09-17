# Triplastindo Finance — UI Specification

> Spesifikasi pembuatan **UI web app Finance Triplastindo** berdasarkan kondisi dan struktur modul pada dokumen `triplastindo-finance-webapp.md`.
>
> Fokus tahap ini adalah **UI/UX frontend terlebih dahulu**, tanpa implementasi logika akuntansi, posting jurnal, kalkulasi laporan, approval, atau integrasi backend.
>
> Target implementasi frontend:
> - Vite
> - React.js
> - Tailwind CSS
> - shadcn/ui
>
> Backend yang akan digunakan pada tahap berikutnya:
> - Laravel
> - MariaDB / MySQL

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

### 6. Input Transaksi

Walaupun pada spreadsheet fungsi ini berkaitan langsung dengan Jurnal Umum, pada web dibuat menjadi halaman tersendiri agar proses input lebih mudah.

Icon:

`CirclePlus`

Route:

```text
/transactions/create
```

### 7. Jurnal Umum

Icon:

`NotebookTabs`

Route:

```text
/journals
```

---

## Keuangan

### 8. Utang

Icon:

`HandCoins`

Route:

```text
/payables
```

### 9. Piutang

Icon:

`WalletCards`

Route:

```text
/receivables
```

### 10. Bagi Hasil

Icon:

`BadgeDollarSign`

Route:

```text
/profit-sharing
```

---

## Operasional

### 11. Summary Inventory & Penjualan

Icon:

`Boxes`

Route:

```text
/inventory-summary
```

> Pada tahap UI pertama ini, inventory hanya mengikuti struktur summary yang sudah ada pada dokumen. Belum dibuat sistem inventory terintegrasi.

### 12. Aset & Depresiasi

Icon:

`Factory`

Route:

```text
/assets
```

---

## Payroll

### 13. Gaji Karyawan

Icon:

`UsersRound`

Route:

```text
/payroll
```

### 14. Slip Gaji

Icon:

`ReceiptText`

Route:

```text
/payslips
```

---

## Sistem

### 15. Setup

Icon:

`Settings`

Route:

```text
/setup
```

Setup nantinya memiliki submenu/tab:

- Chart of Accounts
- Master Aset
- Master Karyawan
- Pemegang Saham
- Jenis Pembayaran
- Tahun Buku / Periode
- Profil Perusahaan
- Parameter

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

# 7. Input Transaksi

Route:

```text
/transactions/create
```

Gunakan tabs:

```text
Transaksi Sederhana
Jurnal Majemuk
```

## 7.1 Transaksi Sederhana

Form:

- Tanggal
- Akun Debit
- Akun Kredit
- Nominal
- Jenis Pembayaran
- Keterangan
- No. Hutang
- No. Piutang
- Upload Bukti

Button:

```text
Simpan Transaksi
```

Tambahkan card:

```text
Preview Jurnal
```

Contoh:

| Akun | Debit | Kredit |
|---|---:|---:|
| Bank BCA | Rp 10.000.000 | - |
| Penjualan Tali | - | Rp 10.000.000 |

Status:

```text
Balance
```

---

## 7.2 Jurnal Majemuk

Header:

- Tanggal
- Keterangan
- Jenis Pembayaran

Table editable:

| Akun | Keterangan | Debit | Kredit | |
|---|---|---:|---:|---|
| ... | ... | ... | ... | Remove |

Button:

```text
+ Tambah Baris
```

Footer:

```text
Total Debit
Total Kredit
Selisih
```

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

| No Bukti | Tanggal | Keterangan | Account | Debit | Kredit | Tagging |
|---|---|---|---|---:|---:|---|

Transaksi ditampilkan sebagai grouped rows.

Gunakan expandable row.

### Detail transaksi

Tampilkan:

- Nomor jurnal
- Pembuat
- Tanggal dibuat
- Jenis pembayaran
- Lampiran
- Source
- Audit history

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

Rekomendasi:

```text
src/
│
├── app/
│   ├── router/
│   └── providers/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── common/
│   ├── financial/
│   └── charts/
│
├── features/
│   ├── dashboard/
│   ├── transactions/
│   ├── journals/
│   ├── ledger/
│   ├── reports/
│   │   ├── profit-loss/
│   │   ├── balance-sheet/
│   │   └── cash-flow/
│   ├── payables/
│   ├── receivables/
│   ├── inventory/
│   ├── payroll/
│   ├── payslips/
│   ├── assets/
│   ├── profit-sharing/
│   └── setup/
│
├── layouts/
│
├── lib/
│
├── hooks/
│
├── services/
│
├── mocks/
│
└── types/
```

Walaupun tahap pertama belum memiliki backend, buat:

```text
services/
```

agar nantinya API Laravel tidak dicampur langsung ke component.

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

- Input Transaksi
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
