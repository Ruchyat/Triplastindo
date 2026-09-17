# Triplastindo Finance — Ringkasan Produk dan Flow Penggunaan

Dokumen ini menjelaskan secara ringkas apa yang akan dibuat, bagaimana alur penggunaannya, dan output apa yang ingin dicapai oleh aplikasi Finance Triplastindo.

Dokumen ini dapat digunakan sebagai pengingat ketika tujuan atau ruang lingkup proyek mulai terasa bias.

---

## 1. Apa yang Ingin Dibuat?

Triplastindo Finance adalah **web app finance internal** yang menjadi pusat pencatatan dan pelaporan keuangan Triplastindo.

Aplikasi ini bukan sekadar memindahkan tampilan atau data dari Google Sheets ke website. Aplikasi ini ditujukan untuk menjadi solusi atas kebutuhan operasional perusahaan, yaitu:

- Mencatat transaksi keuangan.
- Memastikan debit dan kredit selalu seimbang.
- Mengelola utang dan piutang.
- Mengelola aset dan depresiasi.
- Mengelola payroll dan slip gaji.
- Mencatat inventory dan penjualan.
- Mengelola pembagian laba dan dividen.
- Menghasilkan laporan keuangan otomatis.
- Mengatur hak akses pengguna.
- Menyimpan audit trail atau riwayat perubahan.
- Mengurangi ketergantungan pada formula spreadsheet yang rapuh.

---

## 2. Prinsip Utama Sistem

Pusat data keuangan aplikasi adalah **Jurnal Umum**.

Setiap aktivitas keuangan harus diterjemahkan menjadi jurnal dengan prinsip:

```text
Total Debit = Total Kredit
```

Laporan keuangan tidak diinput secara manual. Laporan dihitung dari transaksi yang sudah masuk ke Jurnal Umum.

Dengan prinsip ini, hubungan antarbagian aplikasi menjadi:

```text
SETUP DATA MASTER
COA, karyawan, aset, pemegang saham, periode
                  ↓
INPUT OPERASIONAL
Transaksi, utang, piutang, payroll, aset, inventory
                  ↓
JURNAL UMUM
Semua aktivitas diterjemahkan menjadi debit dan kredit
                  ↓
BUKU BESAR DAN PERHITUNGAN
Saldo setiap akun dihitung dari jurnal
                  ↓
LAPORAN KEUANGAN
Laba Rugi, Neraca, Arus Kas, rasio, dan laporan pendukung
                  ↓
DASHBOARD
Ringkasan kondisi keuangan untuk pemilik dan manajemen
```

---

## 3. Cara Menggunakan Aplikasi

### 3.1 Setup Awal

Admin atau Finance menyiapkan data yang akan digunakan oleh seluruh aplikasi:

- Chart of Accounts atau daftar akun.
- Tahun buku dan periode aktif.
- Profil perusahaan.
- Data karyawan.
- Data aset.
- Data pemegang saham.
- Jenis pembayaran.
- Minimum saldo kas.
- Persentase pajak dividen.
- Standar rasio keuangan.
- Parameter depresiasi aset.

Setup biasanya dilakukan pada awal penggunaan dan diperbarui ketika terdapat perubahan data perusahaan.

### 3.2 Mencatat Transaksi Harian

Pengguna mencatat **kejadian bisnis**, bukan akun debit dan kredit. Sistem yang
menerjemahkannya menjadi jurnal double-entry.

Contoh penjualan tali tunai sebesar Rp10.000.000. Finance membuka menu **Penjualan**
lalu mengisi customer, produk, kuantitas, harga, dan metode pembayaran. Sistem
membentuk jurnal berikut di belakang layar:

```text
Debit  Bank BCA          Rp10.000.000
Kredit Penjualan Tali    Rp10.000.000
```

Bila penjualan dilakukan secara kredit, jurnalnya menjadi:

```text
Debit  Piutang Usaha     Rp10.000.000
Kredit Penjualan Tali    Rp10.000.000
```

Preview jurnal tetap ditampilkan pada form, sehingga Finance dapat memeriksa hasilnya
sebelum dokumen diposting.

### 3.3 Memilih Menu yang Tepat

| Aktivitas | Menu | Jurnal yang dibentuk |
|---|---|---|
| Penjualan tunai maupun kredit | Penjualan | Pendapatan, lalu Kas/Bank atau Piutang |
| Pembelian tunai maupun kredit | Pembelian | Persediaan/Beban/Aset, lalu Kas/Bank atau Utang |
| Biaya tanpa pembelian barang | Pengeluaran | Beban dan Kas/Bank |
| Pelunasan invoice atau tagihan | Kas & Bank | Piutang atau Utang berkurang |
| Transfer antar rekening | Kas & Bank | Mutasi antar akun Kas & Bank |
| Uang titipan customer | Deposit Pelanggan | Kewajiban Deposit Pelanggan |
| Pembayaran gaji | Payroll | Beban gaji dan Kas/Bank |
| Pembelian mesin atau kendaraan | Pembelian, kategori Aset | Aset Tetap |
| Produksi dan penjualan barang | Inventory & Penjualan | Mutasi stok |
| Pembagian keuntungan | Bagi Hasil | Dividen dan Kas/Bank |
| Penyesuaian dan koreksi | Jurnal Manual | Sesuai jurnal yang disusun Finance |

Utang dan Piutang **tidak diinput manual**. Keduanya terbentuk otomatis dari dokumen
pembelian dan penjualan kredit, lalu berkurang ketika pembayarannya dicatat di menu
Kas & Bank.

Satu customer tidak boleh memiliki saldo deposit dan piutang terbuka secara bersamaan.
Saat invoice dibuat, saldo deposit dipotong lebih dahulu, dan sisanya baru menjadi piutang.

### 3.4 Memeriksa Jurnal Umum

Jurnal Umum digunakan untuk memeriksa seluruh transaksi keuangan.

Finance dapat melihat:

- Nomor jurnal.
- Tanggal transaksi.
- Akun debit dan kredit.
- Nominal.
- Keterangan.
- Jenis pembayaran.
- Tagging Kas & Bank atau Non Kas & Bank.
- Sumber transaksi.
- Pembuat transaksi.
- Lampiran.
- Riwayat perubahan.

Sistem tidak boleh mengizinkan jurnal yang tidak seimbang.

### 3.5 Memeriksa Buku Besar

Buku Besar memperlihatkan riwayat transaksi dan saldo berjalan untuk setiap akun.

Contohnya, ketika pengguna memilih akun Bank BCA, sistem menampilkan:

- Saldo awal.
- Semua uang masuk.
- Semua uang keluar.
- Saldo setelah setiap transaksi.
- Total debit.
- Total kredit.
- Saldo akhir.

### 3.6 Menutup Periode

Setelah transaksi satu bulan selesai diperiksa, Finance dapat menjalankan proses tutup buku.

Proses ini nantinya mencakup:

- Posting depresiasi bulanan.
- Penutupan laba periode.
- Penyimpanan snapshot laporan.
- Penguncian transaksi pada periode tersebut.

Transaksi pada periode yang sudah ditutup tidak dapat diedit. Pembukaan kembali periode hanya dapat dilakukan oleh Super Admin.

### 3.7 Membaca Laporan

Setelah transaksi tercatat, aplikasi menghasilkan laporan berikut.

#### Laporan Laba Rugi

Menjawab pertanyaan:

- Berapa pendapatan perusahaan?
- Berapa biaya produksi?
- Berapa beban operasional?
- Apakah perusahaan menghasilkan laba atau rugi?

#### Laporan Neraca

Menjawab pertanyaan:

- Berapa nilai aset perusahaan?
- Berapa jumlah utang perusahaan?
- Berapa nilai modal dan ekuitas?
- Apakah neraca sudah seimbang?

#### Laporan Arus Kas

Menjawab pertanyaan:

- Dari mana kas masuk?
- Untuk apa kas digunakan?
- Berapa kas dari aktivitas operasi?
- Berapa kas dari investasi dan pendanaan?
- Berapa saldo kas akhir?

#### HPP per Kg

Menjawab pertanyaan:

- Berapa biaya bahan baku per kilogram?
- Berapa biaya produksi per kilogram?
- Berapa total HPP per kilogram?
- Berapa margin terhadap harga jual?

#### Rasio Keuangan

Memberikan indikator mengenai:

- Kemampuan membayar kewajiban jangka pendek.
- Margin laba kotor.
- Margin laba bersih.
- Perbandingan utang terhadap modal.
- Kemampuan pendapatan menghasilkan kas.

### 3.8 Membaca Dashboard

Dashboard digunakan oleh pemilik dan manajemen untuk melihat kondisi perusahaan dengan cepat.

Dashboard menjawab pertanyaan:

- Berapa total pendapatan?
- Berapa total biaya?
- Berapa laba bersih?
- Berapa saldo kas?
- Berapa utang yang belum dibayar?
- Berapa piutang yang belum tertagih?
- Apakah kondisi keuangan sehat?
- Apakah kas cukup untuk membagikan dividen?

---

## 4. Hubungan Data dari Transaksi sampai Dashboard

Angka pada Dashboard harus dapat ditelusuri sampai ke transaksi asalnya.

Contoh alur penelusuran laba bersih:

```text
Dashboard
   ↓
Nilai Laba Bersih
   ↓
Laporan Laba Rugi
   ↓
Akun Pendapatan dan Beban
   ↓
Jurnal Umum
   ↓
Transaksi Asal
```

Contoh alur penelusuran saldo kas:

```text
Dashboard
   ↓
Saldo Kas Usaha
   ↓
Laporan Arus Kas dan Neraca
   ↓
Akun Kas & Bank
   ↓
Buku Besar
   ↓
Transaksi Penerimaan dan Pengeluaran Kas
```

Jika sebuah angka tidak dapat ditelusuri sampai ke sumber transaksi, berarti sistem belum memenuhi tujuan utamanya.

---

## 5. Output Akhir yang Dikejar

Output akhir proyek bukan hanya tampilan website. Sistem harus menghasilkan tiga keluaran utama.

### 5.1 Pencatatan Keuangan yang Benar

- Setiap transaksi memiliki jurnal.
- Total debit selalu sama dengan total kredit.
- Transaksi tersimpan secara konsisten.
- Periode lama dapat dikunci.
- Perubahan dapat dilacak melalui audit log.
- Sistem tidak menampilkan `#DIV/0!`, `#N/A`, `#REF!`, `NaN`, atau nilai rusak lainnya.

### 5.2 Laporan Keuangan yang Dapat Dipercaya

- Laba Rugi dihitung dari jurnal.
- Neraca selalu balance.
- Saldo akhir Arus Kas sesuai dengan saldo Kas & Bank pada Neraca.
- Buku Besar sesuai dengan transaksi pada Jurnal Umum.
- Utang dan piutang sesuai dengan jurnal terkait.
- Nilai laporan dapat ditelusuri sampai ke transaksi asal.

### 5.3 Informasi untuk Mengambil Keputusan

Pemilik dan manajemen dapat menggunakan sistem untuk memutuskan:

- Apakah bisnis menghasilkan laba?
- Apakah saldo kas mencukupi kebutuhan operasional?
- Apakah utang terlalu tinggi?
- Apakah piutang berhasil ditagih?
- Berapa biaya produksi per kilogram?
- Aset apa yang masih bernilai dan berapa depresiasinya?
- Apakah perusahaan aman membagikan laba?
- Berapa dividen setiap pemegang saham?

---

## 6. Pengguna dan Tanggung Jawabnya

| Peran | Tanggung Jawab Utama |
|---|---|
| Super Admin | Mengelola user, hak akses, setup, periode, dan seluruh data |
| Finance / Akuntan | Mencatat transaksi, memeriksa jurnal, mengelola utang/piutang, dan membuat laporan |
| HR / Payroll | Mengelola karyawan, payroll, dan slip gaji |
| Direksi / Owner | Membaca laporan, memantau Dashboard, dan menyetujui pembagian laba |
| Viewer / Pemegang Saham | Melihat laporan ringkas dan dividen miliknya sendiri |

---

## 7. Posisi Pengerjaan Saat Ini

Diperbarui 17 September 2026.

Proyek sudah melewati tahap UI dan kini memiliki backend dengan autentikasi yang berfungsi.

### Sudah tersedia

**Frontend**

- Layout aplikasi, sidebar, dan navigasi desktop maupun mobile.
- Seluruh halaman modul beserta tabel, filter, form, tab, card, drawer, dan preview laporan.
- Struktur folder berbasis fitur, komponen yang dapat dipakai ulang, dan mock data terpisah dari tampilan.
- Halaman login, penjaga route, dan penyimpanan sesi.

**Backend**

- Laravel 13 dengan database MySQL.
- Autentikasi token Bearer memakai Laravel Sanctum.
- Akun Super Admin beserta kolom peran pada tabel user.
- Pembatasan percobaan login dan penolakan akun nonaktif.

**Lingkungan pengembangan**

- Backend, frontend, dan tunnel berjalan permanen tanpa perlu dinyalakan manual.
- Aplikasi dapat dibuka dari internet melalui domain pengembangan.
- Rinciannya ada pada dokumen `triplastindo-lingkungan-pengembangan.md`.

### Belum tersedia

- Penyimpanan transaksi dan posting jurnal.
- Kalkulasi akuntansi dan laporan dari data sebenarnya.
- Matriks hak akses per modul.
- Tutup buku dan approval.
- Upload lampiran, export PDF, dan export Excel.
- Audit trail.
- Integrasi dengan bank atau layanan lain.

Seluruh halaman modul masih membaca mock data. Artinya bentuk produk sudah dapat
ditinjau dan pengguna sudah dapat masuk ke aplikasi, tetapi kegiatan finance yang
sebenarnya belum dapat dijalankan.

---

## 8. Tahapan Menuju Produk yang Dapat Digunakan

```text
UI Frontend
    ↓
Kontrak API
    ↓
Rancangan Database
    ↓
Backend Laravel
    ↓
Integrasi React dengan Laravel
    ↓
Implementasi Aturan Akuntansi
    ↓
Migrasi atau Input Data Awal
    ↓
Validasi dengan Google Sheet Aktual
    ↓
Pengujian Pengguna
    ↓
Go-Live
```

Urutan implementasi yang disarankan:

1. ~~Finalisasi UI dan alur pengguna.~~ **Selesai.**
2. ~~Implementasikan autentikasi.~~ **Selesai** — login, token, dan akun Super Admin.
3. Implementasikan hak akses per modul. Peran sudah tersimpan, tetapi belum membatasi apa pun.
4. Susun kontrak API dan rancangan database untuk modul transaksi.
5. Implementasikan Setup dan master data.
6. Implementasikan Penjualan, Pembelian, Pengeluaran, Kas & Bank, beserta posting jurnal otomatisnya.
7. Implementasikan Jurnal Umum dan Buku Besar dari data sebenarnya.
8. Implementasikan laporan keuangan.
9. Implementasikan Utang, Piutang, Aset, dan tutup buku.
10. Implementasikan Payroll, Slip Gaji, dan Bagi Hasil.
11. Implementasikan Inventory dan Dashboard aktual.
12. Validasi hasil aplikasi terhadap Google Sheet.

---

## 9. Definisi Sederhana Produk

Jika harus dijelaskan dalam satu kalimat:

> Triplastindo Finance adalah sistem informasi keuangan internal dengan Jurnal Umum sebagai pusat data, modul operasional sebagai sumber transaksi, serta laporan keuangan dan Dashboard sebagai output untuk pengambilan keputusan.

Jika mulai mengalami bias mengenai arah proyek, gunakan tiga pertanyaan berikut:

1. Apakah aktivitas ini menghasilkan atau memengaruhi transaksi keuangan?
2. Apakah transaksi tersebut masuk ke Jurnal Umum secara benar dan seimbang?
3. Apakah hasil akhirnya dapat dibaca dan ditelusuri melalui laporan atau Dashboard?

Jika jawaban ketiganya jelas, fitur tersebut masih berada pada arah produk yang benar.
