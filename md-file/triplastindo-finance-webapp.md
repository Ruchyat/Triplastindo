# Triplastindo Finance — Spesifikasi Web App

> Dokumen konteks & kebutuhan fitur untuk migrasi **"Finance Triplastindo Rev. 7" (Google Sheets)** ke web app.
> Status: **draft kebutuhan**. Belum ada keputusan stack & belum ada kode.
> Sumber analisis: Google Sheet "Copy 3 of Finance Triplastindo Rev. 7" (14 tab), dianalisis 17 Sep 2026.

---

## 1. Konteks

### 1.1 Tentang perusahaan
- **Nama:** TRIPLASTINDO
- **Alamat:** Jl. Raya Kedaung Barat No.78, Kedaung Bar., Kec. Sepatan Tim., Kab. Tangerang, Banten 15520
- **Kontak:** Triplastindo@gmail.com · Triplastindo.com
- **Bisnis:** pabrik daur ulang plastik. Bahan baku (karung polos / KW) diolah jadi **biji plastik**, lalu biji plastik diolah jadi **tali**. Pendapatan utama berasal dari **Penjualan Tali** (sekitar 80%) dan **Penjualan Biji Plastik** (sekitar 19%).
- **Pemegang saham:** 4 orang (Koh Yadie 40%, Pak Satria 33,33%, Koh Apin 21,11%, Pak Andri 5,56%, dengan total 3.600.000 lembar).

### 1.2 Tentang spreadsheet saat ini
Sheet ini adalah **sistem akuntansi double-entry** yang dibangun di Google Sheets:

- **Satu sumber kebenaran:** tab **JURNAL UMUM**. Semua laporan (Laba Rugi, Neraca, Arus Kas, Buku Besar, Dashboard) dihitung dengan `SUMIFS`/`QUERY` dari jurnal.
- **Master data** ada di tab **SETUP**: COA, aset, karyawan, bulan, jenis pembayaran, dan profil perusahaan.
- Ada **navigasi sidebar** (Overview, Laporan Laba Rugi, Bagi Hasil, Neraca, Arus Kas, Input Transaksi, Jurnal Umum, Buku Besar, Utang, Piutang, Sales & Inventory, Gaji Karyawan, Slip Gaji, Aset & Depresiasi, Setup) serta tombol **PRINT** di laporan.
- Warna sel dipakai sebagai konvensi: **"Input Manual"** vs **"Otomatis"** (dihitung formula).
- Periode data: **tahun buku 2026**, dengan transaksi riil mulai **Mei–Juni 2026** (sekitar 1.650 baris jurnal). Neraca awal dihitung per **April 2026**, dan aset dinilai dengan harga bekas per April 2026.

### 1.3 Masalah yang ingin diselesaikan dengan web app
- Formula rapuh: di sheet ada error `#REF!` (Jurnal Umum), `#DIV/0!` (realisasi piutang di Dashboard), dan `#N/A` (Slip Gaji, Gaji Karyawan).
- Input jurnal manual 2 baris per transaksi rawan tidak balance.
- Tidak ada kontrol akses per peran, audit trail, atau approval.
- Performa & skalabilitas: ribuan baris `SUMIFS` akan makin berat.
- Kebutuhan multi-user dengan hak akses berbeda.

### 1.4 Keputusan yang sudah diambil
| Topik | Keputusan |
|---|---|
| Scope tahap awal | **Semua 14 modul** |
| Pengguna | **Multi-user + role** |
| Data existing | **Mulai kosong** (tidak import jurnal dari sheet) |
| Stack | *Belum ditentukan* |

---

## 2. Glosarium

| Istilah | Arti |
|---|---|
| COA | Chart of Accounts, yaitu daftar akun berkode `X-XXXXX` |
| Kategori Akun | Pengelompokan COA (Kas & Bank, Persediaan, HPP Produksi, dst.) |
| Saldo Normal | Sisi yang menambah saldo akun: **Debit** atau **Kredit** |
| Tagging Transaksi | `Kas & Bank` atau `Non Kas & Bank`. Menentukan apakah baris jurnal ikut dihitung di Arus Kas |
| HPP Produksi | Harga Pokok Produksi |
| YTD | Year To Date (akumulasi Jan s/d bulan terpilih) |
| MoM | Month over Month |
| WIP | Barang Dalam Proses (biji plastik yang belum jadi tali / dijual sebagai biji) |
| DPR | Dividend Payout Ratio |
| THP | Take Home Pay |
| HU-xxx / PU-xxx | Nomor Hutang / Nomor Piutang |

---

## 3. Arsitektur Konsep

```
             ┌─────────── MASTER DATA (Setup) ───────────┐
             │ COA · Aset · Karyawan · Pemegang Saham ·   │
             │ Jenis Pembayaran · Profil Perusahaan       │
             └───────────────────┬────────────────────────┘
                                 │
  Input Transaksi ──► JURNAL UMUM (double-entry, sumber kebenaran) ◄── Jurnal otomatis:
  Utang / Piutang ───►        │                                         • Depresiasi bulanan
  Gaji Karyawan ─────►        │                                         • Penutupan laba bulanan
  Bagi Hasil (dividen) ►      │
                                 ▼
   Buku Besar · Neraca Saldo · Laba Rugi · Neraca · Arus Kas · Rasio · Dashboard
   Summary Inventory & Penjualan · Slip Gaji · Realisasi Utang/Piutang
```

**Prinsip utama:**
1. Setiap transaksi keuangan **wajib** menjadi jurnal yang **balance** (total debit = total kredit).
2. Laporan **tidak disimpan**, melainkan dihitung dari jurnal (boleh di-cache atau dibuat snapshot saat tutup buku).
3. Modul lain (utang, piutang, gaji, aset, dividen) cukup **membuat jurnal** + menyimpan data operasionalnya.

---

## 4. Role & Hak Akses

| Role | Deskripsi |
|---|---|
| **Super Admin** | Kelola user, role, profil perusahaan, periode/tahun buku, dan semua data |
| **Finance / Akuntan** | Input & edit transaksi, utang, piutang, aset, tutup buku bulanan, lihat semua laporan |
| **HR / Payroll** | Kelola karyawan, input gaji, cetak slip gaji |
| **Direksi / Owner** | Lihat dashboard & semua laporan, approve pembagian laba/dividen |
| **Viewer / Pemegang Saham** | Read-only: dashboard, laporan ringkas, dan bagian dividen miliknya |

**Matriks akses (C = create, R = read, U = update, D = delete, A = approve):**

| Modul | Super Admin | Finance | HR | Direksi | Viewer |
|---|---|---|---|---|---|
| Dashboard | R | R | – | R | R |
| Laporan (LR, Neraca, Arus Kas) | R | R | – | R | R (ringkas) |
| Input Transaksi / Jurnal | CRUD | CRUD | – | R | – |
| Buku Besar | R | R | – | R | – |
| Utang / Piutang | CRUD | CRUD | – | R | – |
| Aset & Depresiasi | CRUD | CRUD | – | R | – |
| Gaji Karyawan / Slip | CRUD | R | CRUD | R | – |
| Bagi Hasil | CRUD | CRU | – | R + A | R (milik sendiri) |
| Summary Inventory | CRUD | CRUD | – | R | – |
| Setup / Master Data | CRUD | CRU (COA) | CRU (karyawan) | R | – |
| User & Role | CRUD | – | – | – | – |

**Kebutuhan tambahan:**
- Login (email + password), reset password, logout.
- **Audit log**: siapa, kapan, dan apa yang diubah (before/after), terutama untuk jurnal.
- Jurnal pada **periode yang sudah ditutup** tidak bisa diedit, kecuali dibuka ulang oleh Super Admin.

---

## 5. Modul & Fitur (14 Modul)

### 5.1 SETUP (Master Data)

**a. Chart of Accounts (COA)**
- CRUD akun: `kode` (format `X-XXXXX`, unik), `nama`, `kategori_akun`, `saldo_normal` (Debit/Kredit), `aktif`.
- Kategori akun yang dipakai beserta pemetaan laporannya:

| Kategori Akun | Kelompok | Laporan |
|---|---|---|
| Kas & Bank | Aset Lancar | Neraca |
| Piutang Usaha | Aset Lancar | Neraca |
| Persediaan | Aset Lancar | Neraca |
| Aktiva Lancar Lainnya | Aset Lancar | Neraca |
| Aset Tetap | Aset Tidak Lancar | Neraca |
| Akumulasi Penyusutan | Kontra Aset | Neraca |
| Kewajiban Lancar | Liabilitas | Neraca |
| Kewajiban Jangka Panjang | Liabilitas | Neraca |
| Ekuitas | Ekuitas | Neraca |
| Pendapatan | Pendapatan | Laba Rugi |
| HPP Produksi | HPP | Laba Rugi |
| Beban Operasional | Beban | Laba Rugi |
| Pendapatan Lainnya | Pendapatan Lain | Laba Rugi |
| Beban Lainnya | Beban Lain | Laba Rugi |
| Beban Pajak | Pajak | Laba Rugi |

- Tombol **"Muat COA default Triplastindo"** (lihat Lampiran A) supaya tidak perlu input manual satu per satu. Tidak wajib dipakai, karena keputusannya mulai kosong.
- Akun yang sudah dipakai di jurnal tidak boleh dihapus (hanya bisa dinonaktifkan).

**b. Master Aset**
- CRUD: `kode_aset` (mis. MCC-01), `nama_aset`, `jenis_aset`.
- Jenis aset: Tanah, Bangunan Pabrik, Gudang Produksi, Kendaraan Ops., Mesin Biji, Mesin Produksi Tali, Mesin Pendukung, Perlengkapan Produksi, Peralatan Produksi, Peralatan Kantor, Software, Perlengkapan Kantor.
- Tiap jenis aset dipetakan ke akun Aset Tetap, Akumulasi Penyusutan, dan Beban Penyusutan (lihat 5.12).

**c. Master Karyawan**
- CRUD: `nama`, `NIK`, `departemen/posisi`, `status` (Staff / Operator / dll.), `aktif`.
- Field departemen/posisi **wajib** ada. Di sheet field ini kosong sehingga Slip Gaji menampilkan `#N/A`.

**d. Master Pemegang Saham**
- CRUD: `nama`, `jumlah_saham`. `% share` dihitung otomatis dari total saham.

**e. Referensi lain**
- Jenis pembayaran: Cash, Transfer Antar Bank, Transfer Sesama Bank, E-Wallet, Kredit, Payroll, VA.
- Tahun buku / periode aktif (di sheet: 2026).
- Profil perusahaan: nama, alamat, website, email, dan logo (dipakai di header laporan & slip).
- Parameter: **minimum cash** (default Rp 200.000.000), **persentase pajak dividen** (default 10%), **standar rasio** (lihat 5.4), **persentase nilai residu aset** (default 1%).

---

### 5.2 INPUT TRANSAKSI

Form utama untuk mencatat transaksi. Menggantikan input manual 2 baris di sheet.

**Fitur:**
- **Mode sederhana (1 transaksi = 2 akun):** pilih Tanggal, Akun Debit, Akun Kredit, Nominal, Keterangan, dan Jenis Pembayaran. Sistem otomatis membuat 2 baris jurnal.
- **Mode jurnal majemuk:** banyak baris debit/kredit, wajib balance sebelum bisa disimpan.
- **Template transaksi** supaya input lebih cepat, contohnya:
  - Penjualan Tali Tunai → D: Bank/Kas · K: 4-10000 Penjualan Tali
  - Penjualan Biji Tunai → D: Bank/Kas · K: 4-10001 Penjualan Biji Plastik
  - Pembelian Karung Polos → D: 1-10201 Persediaan Bahan Baku Polos · K: Bank/Kas
  - Pemakaian Bahan Baku → D: 5-10000 Pemakaian Bahan Baku Polos · K: Bank/Kas atau Persediaan
  - Bayar Gaji Operator → D: 5-11000 · K: Bank/Kas
  - Tarik/Top-up Petty Cash → D: 1-10002 Petty Cash · K: 1-10003 Bank BCA
  - Terima Pinjaman Investor → D: Bank · K: 2-10005 Hutang Investor (otomatis buat kartu Utang)
  - Penjualan Kredit → D: 1-10100 Piutang Usaha · K: Pendapatan (otomatis buat kartu Piutang)
- **Tagging otomatis:** jika salah satu sisi jurnal memakai akun kategori *Kas & Bank*, semua barisnya ditandai `Kas & Bank`. Jika tidak, `Non Kas & Bank`.
- Field opsional: `No. Hutang` / `No. Piutang` untuk menautkan pembayaran ke kartu utang/piutang.
- Upload lampiran bukti (nota, transfer).
- Validasi: tanggal masuk periode yang terbuka, nominal > 0, akun aktif, dan jurnal balance.

---

### 5.3 JURNAL UMUM

**Tabel utama.** Kolom di sheet: `No`, `Tanggal Transaksi`, `Bulan`, `No. Hutang`, `No. Piutang`, `Kategori Akun`, `COA`, `Nama Akun`, `Tagging Transaksi`, `Debit`, `Credit`, `Keterangan`.

**Fitur:**
- List jurnal dengan filter: rentang tanggal, bulan, akun, kategori, tagging, dan kata kunci keterangan.
- Grouping per transaksi (header + baris), nomor bukti otomatis (mis. `JU/2026/05/0001`).
- Edit/hapus (dengan audit log, dan hanya untuk periode yang terbuka). Hapus = soft delete atau jurnal pembalik.
- Indikator transaksi tidak balance (seharusnya tidak mungkin terjadi, tapi tetap dicek).
- Export Excel/CSV & print.

**Panel analitik (ada di sisi kanan tab Jurnal Umum di sheet):**
- **Rekap PPN** per bulan: PPN Masukan (1-10302), PPN Keluaran (2-10100), dan Selisih PPN.
- **Saldo Kas per Bulan (akumulatif):** Debet, Kredit, dan Balance akun Kas & Bank per bulan + YTD.
- **Neraca Saldo per Kategori:** total debit/kredit per kategori akun + Grand Total.
- **Neraca Saldo per Akun:** debit, kredit, dan saldo per akun.
- **Neraca Saldo per Bulan** dan **per Bulan per Akun**.

**Jurnal otomatis (dibuat sistem):**
- **Depresiasi bulanan** (akhir bulan, tagging `Non Kas & Bank`): D Beban Penyusutan · K Akumulasi Penyusutan, per jenis aset (lihat 5.12).
- **Penutupan laba periode** (akhir bulan): laba bersih bulan berjalan dicatat ke `3-10005 Pendapatan Periode Ini` (di sheet: 30 Jun 26, Rp 394.192.550).
- Dividen, gaji, dan utang/piutang yang diinput di modulnya masing-masing juga menghasilkan jurnal.

---

### 5.4 BUKU BESAR

- Pilih **akun** (dropdown COA) dan tampilkan mutasi: `No`, `Tanggal`, `Bulan`, `Deskripsi`, `Debit`, `Kredit`, dan **Balance berjalan**.
- Saldo dihitung sesuai **saldo normal** akun (Debit: D − K, Kredit: K − D).
- Ringkasan: total debit, total kredit, dan saldo akhir.
- Di sheet ada 3 panel sekaligus (Kategori Debit, Kategori Credit, Kategori Kas). Di web cukup dibuat **multi-panel / bandingkan akun**.
- Filter periode (bulan / rentang tanggal), export & print.
- Referensi **Daftar Akun per Saldo Normal** (Debit vs Kredit).

---

### 5.5 LAPORAN LABA RUGI

**Struktur:**
```
PENDAPATAN                      (4-xxxxx)  → Total dari Pendapatan
HPP PRODUKSI                    (5-xxxxx)  → Total dari HPP Produksi
LABA KOTOR (Gross Profit)       = Pendapatan − HPP
BEBAN OPERASIONAL               (6-xxxxx)  → Total Beban Operasional
LABA OPERASIONAL                = Laba Kotor − Beban Operasional
PENDAPATAN LAINNYA              (7-xxxxx)
BEBAN LAINNYA                   (8-xxxxx)
LABA SEBELUM PAJAK
BEBAN PAJAK                     (9-xxxxx)
LABA BERSIH (Net Profit)
```
- Akun Pendapatan bersaldo kredit. Retur & Potongan Penjualan (saldo normal debit) tampil sebagai pengurang (angka dalam kurung).
- Akun beban: nilai = debit − kredit.

**Tampilan:**
- **Per bulan terpilih:** nominal + **rasio % terhadap total pendapatan** per baris.
- **YTD:** nominal YTD + kolom **Januari–Desember**.
- Header: "Periode Yang Berakhir Pada 01 {Bulan} – {akhir bulan}", tanggal, dan "(dalam IDR)".
- **Overview per bulan:** Pendapatan, Pengeluaran, Laba Rugi, dan **Revenue MoM (%)**, ditambah grafik.
- **Matriks ringkas:** Utang Outstanding, dan nilai Inventory (Karung, Biji Plastik, Tali, Residu Biji, Residu Tali).
- **Info waktu:** tanggal saat ini, bulan saat ini, bulan sebelumnya, dan Growth MoM.
- Print / export PDF dengan kolom tanda tangan "Dibuat Oleh".

**Sub-laporan HPP per Kg** (di sheet terletak di bawah Laporan Arus Kas):
- Input per bulan: **total belanja bahan baku (kg & Rp)**, **total produksi biji (kg)**, **total produksi tali (kg)**, dan **harga jual per kg** (di sheet: 8.300).
- Hitungan:
  - `avg harga beli bahan baku/kg = total belanja Rp / total belanja kg`
  - `HPP komponen per kg = nominal komponen HPP / total produksi biji (kg)`
  - `Biaya ops per kg = total beban operasional / total produksi biji (kg)`
  - `Total HPP per kg = Σ komponen + biaya ops per kg` (contoh Juni: ~7.734/kg)
  - `Rasio = total HPP per kg / harga jual per kg` (contoh: 0,93)

---

### 5.6 LAPORAN NERACA

**Struktur:**
```
ASET
  Aset Lancar : Kas & Bank, Piutang Usaha, Persediaan, Aktiva Lancar Lainnya
  Aset Tetap  : nilai perolehan − Akumulasi Penyusutan
  TOTAL ASET
LIABILITAS
  Kewajiban Lancar
  Kewajiban Jangka Panjang
EKUITAS
  Modal Disetor, Tambahan Modal, Laba Ditahan, Dividen (−), Pendapatan Periode Ini, dst.
TOTAL LIABILITAS + EKUITAS   (harus = TOTAL ASET → tampilkan indikator balance)
```

**Tampilan:**
- Neraca **per bulan** (posisi akhir bulan terpilih) dan **akumulatif YTD**, plus kolom Januari–Desember.
- **Neraca Tahun Lalu / Saldo Awal:** input saldo pembukaan (opening balance) per akun. Di sheet, saldo awal dihitung per April 2026.
- **Balance Kas & Bank:** saldo per akun kas/bank (Kas, Petty Cash, BCA, BNI, BRI, Giro, Cash Advance) dan TOTAL BALANCE.
- **Rasio Keuangan YTD** (nilai, standar, dan status 🟢 Good / 🔴 Bad):

| Rasio | Rumus | Standar default | Good jika |
|---|---|---|---|
| Current Ratio (CR) | Aset Lancar / Kewajiban Lancar | 1,2 | ≥ standar |
| Quick Ratio (QR) | (Aset Lancar − Persediaan) / Kewajiban Lancar | 1,2 | ≥ standar |
| Gross Profit Margin (GPM) | Laba Kotor / Pendapatan | 30% | ≥ standar |
| Net Profit Margin (NPM) | Laba Bersih / Pendapatan | 20% | ≥ standar |
| Debt to Equity (DER) | Total Liabilitas / Total Ekuitas | 1,80 | ≤ standar |
| Cashflow to Revenue (CFR) | Arus Kas Bersih Operasi / Pendapatan | 35% | ≥ standar |
| Asset Turnover | Pendapatan / Total Aset | – | info saja |

- Keterangan penjelasan tiap rasio ditampilkan di bawah tabel (seperti di sheet).
- Semua standar bisa diubah di Setup.

---

### 5.7 LAPORAN ARUS KAS

Dihitung **hanya dari baris jurnal bertagging `Kas & Bank`**, dengan melihat **akun lawan** (bukan akun kas-nya). Rumus di sheet:

**A. Aktivitas Operasi**
- **Penerimaan Kas dari Pelanggan** = Σ Kredit − Σ Debit untuk kategori: *Pendapatan, Pendapatan Lainnya*. Ditambah Σ Kredit kategori: *Piutang Usaha, Persediaan, Aktiva Lancar Lainnya, Kewajiban Lancar*.
- **Pembayaran atas Beban Usaha** = Σ Debit kategori: *HPP Produksi, Beban Operasional, Beban Lainnya, Beban Pajak, Piutang Usaha, Persediaan, Aktiva Lancar Lainnya, Kewajiban Lancar*. Dikurangi Σ Kredit kategori: *HPP Produksi, Beban Operasional, Beban Lainnya, Beban Pajak*.
- **Arus Kas Bersih Operasi** = Penerimaan − Pembayaran.

**B. Aktivitas Investasi**
- Pembelian Aset Tetap (debit kategori Aset Tetap) dan Penjualan Aset Tetap (kredit kategori Aset Tetap).
- **Arus Kas Bersih Investasi**.

**C. Aktivitas Pendanaan** (per nama akun):
- Modal Disetor, Tambahan Modal Disetor: Kredit − Debit
- Dividen: Debit − Kredit (sebagai pengurang)
- Penerimaan Pinjaman / Leasing: Kredit kategori *Kewajiban Jangka Panjang*
- Pembayaran Angsuran Pinjaman / Leasing: Debit kategori *Kewajiban Jangka Panjang*
- **Arus Kas Bersih Pendanaan**.

**D. Saldo Kas**
- Saldo Kas Awal (saldo akhir bulan sebelumnya, atau opening balance)
- Arus Kas Akhir = A + B + C
- **Saldo Kas Akhir** = Saldo Awal + Arus Kas Akhir
- Tabel **Saldo Kas Awal per bulan** (Jan–Des).
- Tampilan per bulan & YTD (kolom Jan–Des), print dengan tanda tangan.
- Validasi: Saldo Kas Akhir harus sama dengan total saldo akun Kas & Bank di Neraca. Tampilkan selisih jika tidak sama (di sheet ada angka selisih yang tidak berlabel).

---

### 5.8 UTANG USAHA

**Kartu utang** (di sheet otomatis diambil dari jurnal: baris kredit ke kategori *Kewajiban Lancar / Kewajiban Jangka Panjang*).

Kolom: `No`, `Tanggal Utang`, `Bulan`, `COA`, `Akun Utang`, `Keterangan`, `Nama Kreditur`, `No. Hutang` (auto `HU-001`), `Jatuh Tempo`, `Nominal Awal`, `Bunga (%)`, `Nominal Akhir`, `Nominal Dibayarkan`, `Beban Bunga`, `Nominal Sisa`.

**Rumus:**
- `Nominal Akhir = Nominal Awal × (1 + Bunga%)`
- `Nominal Dibayarkan = Σ Debit jurnal dengan No. Hutang & akun yang sama`
- `Beban Bunga = Nominal Akhir − Nominal Awal`
- `Nominal Sisa = Nominal Akhir − Nominal Dibayarkan`

**Fitur:**
- Buat utang baru (sekaligus membuat jurnal penerimaan), catat pembayaran/cicilan (sekaligus membuat jurnal D Utang · K Kas).
- Status: Belum Bayar / Sebagian / Lunas / **Jatuh Tempo** (lewat tanggal dan sisa > 0).
- Pengingat jatuh tempo (notifikasi H-7 / H-1 / lewat).
- **Summary:** per kreditur/keterangan (Beban Bunga, Total, Terbayar, Sisa) + Grand Total.
- **Matriks:** Total Utang, Utang Terbayar, Utang Outstanding, dan % terbayar (dipakai di Dashboard).

---

### 5.9 PIUTANG USAHA

Sama pola dengan Utang, dari sisi debit kategori *Piutang Usaha* (Piutang Usaha, Piutang Belum Ditagihkan, Piutang Karyawan/kasbon).

Kolom: `No`, `Tanggal Piutang`, `Bulan`, `COA`, `Akun Piutang`, `Keterangan`, `Nama Customer / Debitur`, `No. Piutang` (auto `PU-001`), `Tanggal Jatuh Tempo`, `Nominal Awal`, `Return Bunga (%)`, `Nominal Akhir`, `Nominal Terbayar`, `Nominal Sisa`, `Pendapatan Bunga`.

**Rumus:** analog dengan utang. `Nominal Terbayar = Σ Kredit jurnal dengan No. Piutang yang sama`.

**Fitur:**
- Buat piutang, catat pelunasan (jurnal D Kas · K Piutang), status, dan aging (0–30, 31–60, 61–90, >90 hari).
- **Summary** per debitur/akun + Grand Total.
- **Matriks:** Total Piutang, Piutang Terbayarkan, Saldo Piutang Belum Tertagih, dan % tertagih.
- Wajib menangani pembagian dengan nol (di sheet saat ini muncul `#DIV/0!`).

---

### 5.10 SUMMARY INVENTORY & PENJUALAN

Dua kelompok produk: **WIP (Biji Plastik)** dan **Tali**. Masing-masing punya 3 tabel per bulan (Jan–Des + TOTAL):

| Tabel | Kolom |
|---|---|
| **A. Penjualan per bulan** | Qty (Kg), Penjualan (Rp), Omset, Omset − HPP |
| **B. Persediaan per bulan (Kg)** | Qty In, Qty Out, Qty Sisa |
| **C. Nilai Persediaan (Rp)** | Nominal Persediaan |

Contoh data Juni (WIP): terjual 3.650 kg, penjualan 44.844.000, omset 40.400.000, omset−HPP 20.013.950. Qty in 14.711, out 8.989, sisa 5.722 kg. Nilai persediaan 33.936.202.

**Fitur:**
- Input **mutasi stok** (kg): masuk dari produksi/pembelian, keluar karena penjualan/pemakaian, dengan tanggal & keterangan.
- Qty Sisa = saldo awal + In − Out (running per bulan).
- Nilai persediaan per bulan (input manual atau dihitung dari HPP/kg × sisa kg).
- Penjualan qty (kg) tercatat per transaksi penjualan, supaya harga rata-rata per kg bisa dihitung.
- Item inventory tambahan yang dipakai di Laba Rugi: Karung, Biji Plastik, Tali, Residu Biji, Residu Tali.
- Grafik tren stok & penjualan.

> ⚠️ Perlu konfirmasi: di sheet, qty & nilai persediaan kemungkinan besar diinput manual (tidak terhubung ke jurnal). Lihat bagian 8.

---

### 5.11 GAJI KARYAWAN

Kolom: `No`, `Tanggal Pembayaran`, `Bulan`, `Nama Karyawan`, `Status`, `Gaji Pokok`, `Upah Lembur`, `Allowance`, `Tunjangan / Bonus`, `Pinjaman Kasbon`, `Gaji Kotor`, `Pajak PPh 21`, `BPJS Ketenagakerjaan`, `BPJS Kesehatan`, `Potongan Kasbon`, `Gaji Bersih`, `THP`.

**Rumus (sesuai sheet):**
- `Gaji Kotor = Gaji Pokok + Upah Lembur + Allowance + Tunjangan/Bonus`
- `Gaji Bersih = Gaji Kotor − (PPh 21 + BPJS TK + BPJS Kes)`
- `THP = Gaji Bersih + Pinjaman Kasbon − Potongan Kasbon`
- PPh 21 & BPJS **diinput manual** (opsi pengembangan: kalkulasi otomatis PPh 21 TER & BPJS).

**Fitur:**
- Input payroll per periode (bulk untuk semua karyawan aktif).
- Posting ke jurnal: D Gaji (5-11000 / 6-10001 / dll. sesuai status/departemen) · K Kas/Bank. Kasbon: D 1-10103 Piutang Karyawan.
- **Summary gaji:** per bulan per karyawan (Gaji Kotor, Gaji Bersih, THP) + TOTAL.
- **Monitoring kasbon per karyawan:** Kasbon Sisa Awal, Pinjaman, Potongan, Kasbon Sisa Akhir.
- Validasi: nama karyawan harus ada di master (di sheet muncul `#N/A`).

---

### 5.12 SLIP GAJI

- Pilih karyawan & periode, lalu tampil slip berisi:
  - Header: logo, nama & alamat perusahaan, email.
  - Name / NIK, Dept / Position, Date.
  - **PENDAPATAN:** Gaji Pokok, Upah Lembur, Allowance, Tunjangan/Bonus (+ kasbon yang dicairkan).
  - **POTONGAN:** PPh 21, BPJS Ketenagakerjaan, BPJS Kesehatan, Potongan Kasbon.
  - Total Pendapatan, Total Potongan, **Gaji Bersih / THP**.
- Cetak / download PDF, cetak massal untuk semua karyawan dalam satu periode.
- (Opsional) Karyawan bisa melihat slipnya sendiri jika nanti ada role Karyawan.

---

### 5.13 ASET & DEPRESIASI

Kolom: `No`, `Kode Aset`, `Nama Aset`, `Jenis Aset`, `Tanggal Pembelian`, `Bulan`, `Nominal`, `Umur Manfaat (thn)`, `Nilai Akhir Residu`, `Depresiasi/Thn`, `Depresiasi/Bulan`, `Tanggal Digunakan`, `Umur Berjalan (Bulan)`, `Akumulasi Depresiasi`, `Nilai Residu Aset` (nilai buku).

**Rumus (garis lurus, sesuai sheet):**
- `Nilai Akhir Residu = Nominal × 1%`
- `Depresiasi/Thn = (Nominal − Residu) / Umur Manfaat`
- `Depresiasi/Bulan = Depresiasi/Thn / 12`
- `Umur Berjalan = selisih bulan (Tanggal Digunakan → akhir bulan berjalan)`
- `Akumulasi Depresiasi = Depresiasi/Thn × Umur Berjalan / 12`
- `Nilai Buku = Nominal − Akumulasi Depresiasi`
- Umur manfaat di sheet: Mesin Biji 16 thn, Mesin Tali/Pendukung 5 thn (bisa diatur per aset / default per jenis).

**Fitur:**
- CRUD aset (± 60+ aset: mesin cacah, bak cuci, sentrik, konveyor, mesin proses/potong, spiral baling, tali line, mix, oven, bangunan, truk, peralatan kantor, dll.).
- Aset dengan nominal kosong ditandai (di sheet disorot kuning).
- **Rekap depresiasi per jenis aset** (per bulan & per tahun) + Grand Total.
- **Tabel akumulasi depresiasi per aset per bulan** (Jan–Des).
- **Posting jurnal depresiasi bulanan otomatis** per jenis. Pemetaan akun:

| Jenis Aset | Akun Beban | Akun Akumulasi |
|---|---|---|
| Mesin Biji / Mesin Produksi Tali / Mesin Pendukung | 5-11007 Beban Penyusutan Mesin Produksi | 1-21004 / 1-21005 / 1-21006 |
| Bangunan Pabrik | 5-11008 Beban Penyusutan Bangunan Pabrik | 1-21001 |
| Gudang Produksi | 5-11008 *(konfirmasi)* | 1-21002 |
| Kendaraan Ops. | 6-20004 Beban Penyusutan Kendaraan Ops | 1-21003 |
| Peralatan Produksi | 6-20005 Beban Penyusutan Peralatan Produksi | 1-21008 |
| Peralatan Kantor | 6-20006 Beban Penyusutan Peralatan Kantor | 1-21009 |
| Software | *(konfirmasi)* | 1-21010 Akumulasi Amortisasi Software |

- Pelepasan/penjualan aset: jurnal + laba/rugi pelepasan (8-10002).

---

### 5.14 BAGI HASIL (Laba & Dividen)

**A. Informasi laba rugi bersih per bulan**

Kolom: `Bulan`, `Quarter`, `Saldo Kas Akhir`, `Minimum Cash`, `Check Point ✅`, `Laba Rugi Usaha`, `Status` (Dibagikan / Tidak Dibagikan), `Tgl Keputusan`, `Laba Ditahan`, `Laba Dibagikan`, `DPR`.

- `Check Point` bernilai **✅ Aman** jika Saldo Kas Akhir ≥ Minimum Cash, dan **❌ Tidak Aman** jika sebaliknya. Fungsinya memastikan kas cukup sebelum membagi laba.
- `Laba Ditahan = Laba Rugi Usaha − Laba Dibagikan`
- `DPR = Laba Dibagikan / Laba Rugi Usaha`
- Rekap per Quarter dan tahunan.

**B. Pemegang saham & pembagian dividen**
- Pilih **periode pembagian** (mis. Juni) dan **Total Dividen** (mis. Rp 100.000.000).
- Per pemegang saham: `Jumlah Saham`, `% Share`, `Dividen Bruto = Total × %Share`, `Pajak` (10%), `Dividen Net = Bruto − Pajak`.

**Fitur:**
- **Workflow approval:** Finance mengajukan, lalu Direksi approve (tanggal keputusan tercatat).
- Peringatan jika Check Point "Tidak Aman" tapi tetap ingin membagikan laba.
- Posting jurnal: D 3-10004 Dividen · K Kas/Bank (+ utang pajak dividen jika dipotong).
- Pemegang saham (role Viewer) hanya bisa melihat bagian dividen miliknya.

---

### 5.15 DASHBOARD (Overview)

**Filter:** Periode (bulan tertentu / **YTD**).

**KPI cards** (dalam Rupiah):
- **Total Revenue** + % (Asset Turnover)
- **Total Expenses** + % dari pendapatan
- **Net Profit** + % dari pendapatan
- **Saldo Kas Usaha** "Per Tanggal {hari ini}"
- Indikator naik/turun dibanding periode sebelumnya.

**Widget:**
- **Rasio YTD:** CR, GPM, NPM, DER, CFR dengan status 🟢/🔴.
- **Ringkasan Arus Kas YTD:** Saldo Awal, Uang Masuk (Debit), Uang Keluar (Credit), Saldo Akhir.
- **Overview Keuangan Full Year:** grafik garis/area Pendapatan, Pengeluaran, dan Laba Rugi per bulan (01–12).
- **Laba Bersih Current vs Last Month:** perbandingan bulan ini vs bulan lalu (rasio & nominal dalam juta).
- **Realisasi Utang Usaha YTD:** donut % Paid Payable + Total / Terbayar / Outstanding.
- **Realisasi Piutang Usaha YTD:** donut % Collection Received + Total / Terbayar / Belum Tertagih.
- **Saldo per Akun Kas & Bank.**
- Shortcut navigasi ke semua modul (pengganti sidebar di sheet).

---

## 6. Fitur Umum (Lintas Modul)

- **Periode & Tutup Buku:** buka/tutup bulan. Tutup bulan menjalankan depresiasi, penutupan laba, dan snapshot laporan. Pembukaan ulang hanya oleh Super Admin.
- **Opening balance** per akun untuk awal penggunaan sistem.
- **Print & Export:** semua laporan bisa di-print (layout A4 dengan kop & tanda tangan), export PDF & Excel.
- **Format angka Indonesia:** `Rp 1.234.567`, negatif dalam kurung `( 17.460.000)`, persen `26,0%`, dan tanggal `Selasa, 30 Juni 2026`.
- **Bahasa:** Indonesia.
- **Search & filter** di semua tabel, pagination, dan sort.
- **Audit log** + riwayat perubahan per transaksi.
- **Responsive** (minimal nyaman di tablet, dashboard bisa dibuka di HP).
- **Konvensi warna input vs otomatis** diganti dengan field form (input) vs field read-only (hasil hitung).
- **Notifikasi:** jatuh tempo utang/piutang, kas di bawah minimum, jurnal belum diposting akhir bulan.
- **Backup** data berkala.

---

## 7. Draft Entitas Data (stack-agnostic)

| Entitas | Field utama |
|---|---|
| `users` | nama, email, password, role, aktif |
| `roles` / `permissions` | nama role, izin per modul |
| `company_profile` | nama, alamat, email, website, logo |
| `fiscal_periods` | tahun, bulan, status (open/closed), closed_by, closed_at |
| `settings` | minimum_cash, dividend_tax_pct, residual_pct, ratio_standards (json) |
| `account_categories` | nama, kelompok (aset/liabilitas/ekuitas/pendapatan/beban), laporan |
| `accounts` (COA) | kode, nama, category_id, saldo_normal, is_cash, aktif |
| `opening_balances` | account_id, tanggal, debit, kredit |
| `payment_methods` | nama |
| `journal_entries` | nomor, tanggal, keterangan, tagging, source_type/source_id, payment_method_id, created_by, lampiran |
| `journal_lines` | entry_id, account_id, debit, kredit, payable_id?, receivable_id?, keterangan |
| `transaction_templates` | nama, akun debit default, akun kredit default |
| `payables` (Utang) | nomor HU, tanggal, account_id, kreditur, keterangan, jatuh_tempo, nominal_awal, bunga_pct |
| `receivables` (Piutang) | nomor PU, tanggal, account_id, debitur, keterangan, jatuh_tempo, nominal_awal, bunga_pct |
| `asset_types` | nama, umur_default, akun aset, akun akumulasi, akun beban |
| `assets` | kode, nama, asset_type_id, tgl_beli, tgl_digunakan, nominal, umur_manfaat, residu_pct, status |
| `depreciation_runs` | periode, journal_entry_id |
| `employees` | NIK, nama, departemen, posisi, status, aktif |
| `payrolls` | periode, tanggal_bayar, employee_id, pokok, lembur, allowance, tunjangan, kasbon_pinjam, pph21, bpjs_tk, bpjs_kes, kasbon_potong, journal_entry_id |
| `shareholders` | nama, jumlah_saham |
| `profit_distributions` | periode, laba, status, tgl_keputusan, laba_dibagikan, approved_by, journal_entry_id |
| `dividend_allocations` | distribution_id, shareholder_id, pct, bruto, pajak, net |
| `products` | nama (WIP/Biji, Tali, Karung, Residu Biji, Residu Tali), satuan |
| `stock_movements` | product_id, tanggal, qty_in, qty_out, keterangan, ref |
| `sales_summary` / `inventory_values` | product_id, periode, qty_kg, penjualan, omset, hpp, nilai_persediaan |
| `production_stats` | periode, belanja_bahan_kg, belanja_bahan_rp, produksi_biji_kg, produksi_tali_kg, harga_jual_per_kg |
| `audit_logs` | user_id, aksi, model, before, after, waktu |

---

## 8. Pertanyaan Terbuka (perlu dikonfirmasi ke pihak Triplastindo)

1. **Stack & hosting**: mau pakai apa, dan di-deploy di mana?
2. **Inventory**: qty kg & nilai persediaan diinput manual, atau harus terhubung otomatis ke jurnal pembelian/penjualan/produksi? Apakah perlu kartu stok per gudang?
3. **Input Transaksi** di sheet: apakah berupa form (Apps Script / Google Form) atau hanya link ke Jurnal Umum? Template transaksi apa saja yang paling sering dipakai?
4. **Pemetaan akun depresiasi** untuk Gudang Produksi & Software (lihat 5.13).
5. **PPh 21 & BPJS**: tetap input manual, atau dihitung otomatis (TER PPh 21, tarif BPJS)?
6. **Pajak dividen 10%**: apakah dicatat sebagai utang pajak (2-10106 Hutang PPh Final)?
7. **Standar rasio** (CR/QR 1,2 · GPM 30% · NPM 20% · DER 1,8 · CFR 35%): sudah final?
8. **Minimum cash** Rp 200 juta: tetap, atau per bulan bisa berbeda?
9. Apakah perlu **multi-perusahaan / multi-cabang** di masa depan?
10. Apakah perlu **approval** untuk jurnal di atas nominal tertentu?
11. Apakah pemegang saham/karyawan butuh login sendiri (portal dividen / slip gaji)?
12. Perlu integrasi (mutasi bank, e-Faktur, WhatsApp notifikasi)?

---

## 9. Usulan Tahapan Pengerjaan

| Fase | Isi | Keluaran |
|---|---|---|
| **1. Fondasi** | Auth, role & permission, profil perusahaan, periode, Setup (COA, kategori, jenis pembayaran, karyawan, aset, pemegang saham), audit log | Master data siap |
| **2. Core Akuntansi** | Input Transaksi + template, Jurnal Umum, Buku Besar, opening balance, neraca saldo, rekap PPN | Pencatatan jalan |
| **3. Laporan** | Laba Rugi (bulanan/YTD/HPP per kg), Neraca + rasio, Arus Kas, print/export | Laporan keuangan |
| **4. Sub-ledger** | Utang, Piutang, Aset & Depresiasi (+ jurnal otomatis), tutup buku | Modul pendukung |
| **5. SDM & Pemilik** | Gaji Karyawan, Slip Gaji, Bagi Hasil + approval dividen | Payroll & dividen |
| **6. Operasional & Dashboard** | Summary Inventory & Penjualan, Dashboard lengkap, notifikasi | Semua 14 modul |
| **7. QA & Go-live** | Uji rumus dengan data sheet (Mei–Juni 2026) sebagai pembanding, training user | Siap produksi |

**Kriteria penerimaan utama:**
- Dengan input transaksi yang sama seperti di sheet, angka Laba Rugi, Neraca, dan Arus Kas **identik** dengan sheet. Contoh YTD Juni 2026: Total Pendapatan ±Rp 3,17 M, Laba Bersih ±Rp 470 jt, Saldo Kas Akhir ±Rp 231,6 jt.
- Neraca selalu balance, dan jurnal tidak bisa disimpan kalau tidak balance.
- Tidak ada error tampilan (`#DIV/0!`, `#N/A`, `#REF!`). Kondisi kosong ditampilkan sebagai `0` / `–`.

---

## Lampiran A — COA Default Triplastindo

**1 — ASET**

| Kode | Nama Akun | Kategori | Saldo Normal |
|---|---|---|---|
| 1-10001 | Kas | Kas & Bank | Debit |
| 1-10002 | Petty Cash | Kas & Bank | Debit |
| 1-10003 | Bank BCA | Kas & Bank | Debit |
| 1-10004 | Bank BNI | Kas & Bank | Debit |
| 1-10005 | Bank BRI | Kas & Bank | Debit |
| 1-10006 | Giro | Kas & Bank | Debit |
| 1-10010 | Cash Advance Karyawan | Kas & Bank | Debit |
| 1-10100 | Piutang Usaha | Piutang Usaha | Debit |
| 1-10101 | Piutang Belum Ditagihkan | Piutang Usaha | Debit |
| 1-10102 | Cadangan Kerugian Piutang | Piutang Usaha | Kredit |
| 1-10103 | Piutang Karyawan | Piutang Usaha | Debit |
| 1-10200 | Persediaan Bahan Baku KW | Persediaan | Debit |
| 1-10201 | Persediaan Bahan Baku Polos | Persediaan | Debit |
| 1-10202 | Persediaan Barang Dalam Proses (WIP) | Persediaan | Debit |
| 1-10203 | Persediaan Barang Jadi Tali | Persediaan | Debit |
| 1-10204 | Persediaan Lain | Persediaan | Debit |
| 1-10205 | Persediaan Sparepart | Persediaan | Debit |
| 1-10300 | Uang Muka Pembelian | Aktiva Lancar Lainnya | Debit |
| 1-10301 | Biaya Dibayar Dimuka | Aktiva Lancar Lainnya | Debit |
| 1-10302 | PPN Masukan | Aktiva Lancar Lainnya | Debit |
| 1-10303 | PPN Lebih Bayar | Aktiva Lancar Lainnya | Debit |
| 1-10304 | PPh 22 Dibayar Dimuka | Aktiva Lancar Lainnya | Debit |
| 1-10305 | PPh 23 Dibayar Dimuka | Aktiva Lancar Lainnya | Debit |
| 1-10306 | PPh 25 Dibayar Dimuka | Aktiva Lancar Lainnya | Debit |
| 1-20000 | Tanah | Aset Tetap | Debit |
| 1-20001 | Bangunan Pabrik | Aset Tetap | Debit |
| 1-20002 | Gudang | Aset Tetap | Debit |
| 1-20003 | Kendaraan Ops | Aset Tetap | Debit |
| 1-20004 | Mesin Biji | Aset Tetap | Debit |
| 1-20005 | Mesin Tali | Aset Tetap | Debit |
| 1-20006 | Mesin Lain-lain | Aset Tetap | Debit |
| 1-20007 | Peralatan Produksi | Aset Tetap | Debit |
| 1-20008 | Peralatan Kantor | Aset Tetap | Debit |
| 1-21001 | Akumulasi Penyusutan Bangunan Pabrik | Akumulasi Penyusutan | Kredit |
| 1-21002 | Akumulasi Penyusutan Gudang Produksi | Akumulasi Penyusutan | Kredit |
| 1-21003 | Akumulasi Penyusutan Kendaraan Ops | Akumulasi Penyusutan | Kredit |
| 1-21004 | Akumulasi Penyusutan Mesin Biji | Akumulasi Penyusutan | Kredit |
| 1-21005 | Akumulasi Penyusutan Mesin Tali | Akumulasi Penyusutan | Kredit |
| 1-21006 | Akumulasi Penyusutan Mesin Lain-lain | Akumulasi Penyusutan | Kredit |
| 1-21008 | Akumulasi Penyusutan Peralatan Produksi | Akumulasi Penyusutan | Kredit |
| 1-21009 | Akumulasi Penyusutan Peralatan Kantor | Akumulasi Penyusutan | Kredit |
| 1-21010 | Akumulasi Amortisasi Software | Akumulasi Penyusutan | Kredit |

> Catatan: di sheet, 1-10010 Cash Advance Karyawan tercatat saldo normal "Kas & Bank" (sepertinya salah ketik). Di sini diasumsikan **Debit**.

**2 — LIABILITAS**

| Kode | Nama Akun | Kategori | Saldo Normal |
|---|---|---|---|
| 2-10000 | Hutang Usaha | Kewajiban Lancar | Kredit |
| 2-10001 | Hutang Supplier Karung | Kewajiban Lancar | Kredit |
| 2-10002 | Hutang Supplier Bahan Pendukung | Kewajiban Lancar | Kredit |
| 2-10003 | Hutang Gaji | Kewajiban Lancar | Kredit |
| 2-10004 | Hutang Bonus | Kewajiban Lancar | Kredit |
| 2-10005 | Hutang Investor | Kewajiban Lancar | Kredit |
| 2-10006 | Biaya Masih Harus Dibayar | Kewajiban Lancar | Kredit |
| 2-10007 | Pendapatan Diterima Dimuka | Kewajiban Lancar | Kredit |
| 2-10100 | PPN Keluaran | Kewajiban Lancar | Kredit |
| 2-10101 | Hutang PPh 21 | Kewajiban Lancar | Kredit |
| 2-10102 | Hutang PPh 22 | Kewajiban Lancar | Kredit |
| 2-10103 | Hutang PPh 23 | Kewajiban Lancar | Kredit |
| 2-10104 | Hutang PPh 25 | Kewajiban Lancar | Kredit |
| 2-10105 | Hutang PPh 29 | Kewajiban Lancar | Kredit |
| 2-10106 | Hutang PPh Final | Kewajiban Lancar | Kredit |
| 2-20000 | Hutang Bank | Kewajiban Jangka Panjang | Kredit |
| 2-20001 | Hutang Leasing | Kewajiban Jangka Panjang | Kredit |
| 2-20002 | Hutang Pemegang Saham | Kewajiban Jangka Panjang | Kredit |
| 2-20003 | Liabilitas Imbalan Kerja | Kewajiban Jangka Panjang | Kredit |

**3 — EKUITAS**

| Kode | Nama Akun | Kategori | Saldo Normal |
|---|---|---|---|
| 3-10000 | Modal Disetor | Ekuitas | Kredit |
| 3-10001 | Tambahan Modal Disetor | Ekuitas | Kredit |
| 3-10002 | Laba Ditahan | Ekuitas | Kredit |
| 3-10003 | Selisih Revaluasi | Ekuitas | Kredit |
| 3-10004 | Dividen | Ekuitas | Debit |
| 3-10005 | Pendapatan Periode Ini | Ekuitas | Kredit |
| 3-10006 | Saldo Penyesuaian Awal Ekuitas | Ekuitas | Kredit |

**4 — PENDAPATAN**

| Kode | Nama Akun | Kategori | Saldo Normal |
|---|---|---|---|
| 4-10000 | Penjualan Tali | Pendapatan | Kredit |
| 4-10001 | Penjualan Biji Plastik | Pendapatan | Kredit |
| 4-10002 | Penjualan Lain-Lain | Pendapatan | Kredit |
| 4-10003 | Retur Penjualan | Pendapatan | Debit |
| 4-10004 | Potongan Penjualan | Pendapatan | Debit |

**5 — HPP PRODUKSI** (semua saldo normal Debit)

| Kode | Nama Akun |
|---|---|
| 5-10000 | Pemakaian Bahan Baku Polos |
| 5-10001 | Pemakaian Bahan Baku KW |
| 5-10002 | Pemakaian Bahan Pendukung |
| 5-11000 | Gaji Operator Produksi |
| 5-11001 | Lembur Borongan Produksi |
| 5-11002 | Gaji Supervisor Produksi |
| 5-11003 | Listrik Produksi |
| 5-11004 | Pelumas Mesin |
| 5-11005 | Sparepart Mesin |
| 5-11006 | Jasa Maintenance Mesin |
| 5-11007 | Beban Penyusutan Mesin Produksi |
| 5-11008 | Beban Penyusutan Bangunan Pabrik |
| 5-11010 | Perlengkapan Produksi |
| 5-11011 | Biaya Timbang, QC, Uang Jalan |
| 5-11012 | Waste Produksi |
| 5-11013 | Overhead Lain |

**6 — BEBAN OPERASIONAL** (semua saldo normal Debit)

| Kode | Nama Akun |
|---|---|
| 6-10000 | Gaji Direksi |
| 6-10001 | Gaji Staff |
| 6-10002 | Gaji Tim Lapang |
| 6-10003 | THR & Bonus |
| 6-10004 | BPJS |
| 6-10005 | ATK |
| 6-10006 | Internet |
| 6-10007 | Konsumsi |
| 6-10008 | Keamanan |
| 6-10009 | Kebersihan |
| 6-10010 | Legal/Audit |
| 6-10011 | Perizinan |
| 6-10012 | Admin Bank |
| 6-20000 | Sewa Lahan Produksi Biji |
| 6-20001 | Sewa Lahan Produksi Tali |
| 6-20002 | Maintenance Bangunan Pabrik |
| 6-20003 | Maintenance dan Part Kendaraan Ops |
| 6-20004 | Beban Penyusutan Kendaraan Ops |
| 6-20005 | Beban Penyusutan Peralatan Produksi |
| 6-20006 | Beban Penyusutan Peralatan Kantor |
| 6-30000 | Iklan dan Promosi |
| 6-30001 | Bonus Sales |
| 6-30002 | Beban Transport Penjualan |
| 6-30003 | Entertainment Customer/Supplier |
| 6-30004 | Pengeluaran Lainnya |

**7 — PENDAPATAN LAINNYA** (Kredit): 7-10000 Pendapatan Bunga · 7-10001 Pendapatan Selisih Kurs · 7-10099 Pendapatan Lain-lain

**8 — BEBAN LAINNYA** (Debit): 8-10000 Beban Bunga · 8-10001 Rugi Selisih Kurs · 8-10002 Rugi Pelepasan Aset · 8-10003 Penyesuaian Persediaan · 8-10099 Beban Lain-lain

**9 — BEBAN PAJAK** (Debit): 9-10000 Beban Pajak Kini · 9-10001 Beban Pajak Tangguhan · 9-10002 Koreksi Pajak

---

## Lampiran B — Pemetaan Tab Sheet → Modul Web

| # | Tab Google Sheet | Modul Web | Tipe |
|---|---|---|---|
| 1 | DASHBOARD | Dashboard | Laporan |
| 2 | LAPORAN LABA RUGI | Laporan Laba Rugi (+ HPP per Kg) | Laporan |
| 3 | LAPORAN ARUS KAS | Laporan Arus Kas | Laporan |
| 4 | JURNAL UMUM | Input Transaksi + Jurnal Umum + Neraca Saldo + Rekap PPN | Input + Laporan |
| 5 | LAPORAN NERACA | Laporan Neraca + Rasio + Opening Balance | Laporan |
| 6 | BUKU BESAR | Buku Besar | Laporan |
| 7 | BAGI HASIL | Bagi Hasil & Dividen | Input + Approval |
| 8 | SLIP GAJI | Slip Gaji | Output/Print |
| 9 | SETUP | Master Data | Input |
| 10 | ASET & DEPRESIASI | Aset & Depresiasi | Input + Otomatis |
| 11 | UTANG | Utang Usaha | Input + Laporan |
| 12 | PIUTANG | Piutang Usaha | Input + Laporan |
| 13 | GAJI KARYAWAN | Payroll | Input |
| 14 | SUMMARY INVENTORY & PENJUALAN | Inventory & Penjualan | Input + Laporan |
