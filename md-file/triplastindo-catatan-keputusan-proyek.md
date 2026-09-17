# Triplastindo Finance — Catatan Diskusi, Keputusan, dan Kondisi Proyek

> Dokumen ini mencatat pemahaman bersama, keputusan produk, tujuan, dan kondisi terkini proyek Triplastindo Finance.
>
> Dokumen ini menjadi sumber konteks terbaru ketika terdapat perbedaan pemahaman dengan dokumen sebelumnya.

---

## 1. Tujuan Produk

Triplastindo Finance akan dibangun sebagai **aplikasi finance/accounting internal berbasis akrual**.

Tujuan utamanya adalah:

- Mencatat kejadian bisnis yang sudah memiliki dampak keuangan.
- Mencatat transaksi yang melibatkan kas maupun yang belum melibatkan kas.
- Menghindari pencatatan transaksi yang sama di beberapa sistem atau sheet.
- Membentuk jurnal akuntansi secara otomatis dari transaksi bisnis.
- Menghasilkan informasi utang, piutang, kas, laba rugi, neraca, dan arus kas dari satu sumber data.
- Memberikan informasi keuangan yang dapat digunakan manajemen untuk mengambil keputusan.

Aplikasi tidak ditujukan sebagai sistem operasional pabrik penuh. Aktivitas operasional dicatat apabila sudah menimbulkan dampak keuangan, hak, atau kewajiban.

---

## 2. Pemahaman tentang Sistem yang Berjalan

Google Sheet Finance Triplastindo saat ini memiliki konsep dasar finance/accounting yang cukup lengkap, meliputi:

- Jurnal Umum.
- Buku Besar.
- Laporan Laba Rugi.
- Laporan Neraca.
- Laporan Arus Kas.
- Utang.
- Piutang.
- Aset dan depresiasi.
- Payroll dan slip gaji.
- Inventory dan penjualan.
- Bagi hasil atau dividen.
- Dashboard keuangan.

Namun, proses pencatatan transaksi bisnis belum berada dalam satu sistem.

Contoh kondisi yang terjadi:

- Penjualan kredit dicatat pada sheet atau sumber lain.
- Penjualan tersebut belum masuk ke sistem finance utama ketika hak tagih muncul.
- Transaksi baru masuk ke sheet finance ketika pelanggan melakukan pembayaran.
- Finance perlu melakukan pencatatan ulang atau memindahkan informasi antar-sheet.

Akibatnya:

- Piutang tidak langsung terbentuk saat invoice atau penjualan kredit terjadi.
- Informasi penjualan dan hak tagih dapat terlambat masuk ke laporan.
- Terjadi risiko input ganda.
- Data transaksi dan pembayaran tidak berada dalam satu alur.
- Sulit menelusuri hubungan antara penjualan, invoice, piutang, dan pembayaran.

---

## 3. Basis Pencatatan yang Disepakati

Sistem menggunakan konsep **akuntansi berbasis akrual**.

Artinya, transaksi dicatat ketika hak atau kewajiban muncul, walaupun uang belum diterima atau dibayarkan.

### Contoh penjualan kredit

Saat invoice penjualan dibuat:

```text
Debit  Piutang Usaha
Kredit Penjualan
```

Saat pelanggan membayar:

```text
Debit  Kas / Bank
Kredit Piutang Usaha
```

### Contoh pembelian kredit

Saat tagihan pembelian diterima:

```text
Debit  Persediaan / Beban / Aset
Kredit Utang Usaha
```

Saat perusahaan membayar supplier:

```text
Debit  Utang Usaha
Kredit Kas / Bank
```

Dengan demikian:

- Penjualan tidak menunggu pembayaran untuk dicatat.
- Pembelian tidak menunggu pembayaran untuk dicatat.
- Pembayaran menjadi transaksi terpisah yang menyelesaikan utang atau piutang.
- Laporan Laba Rugi dan Neraca dapat menunjukkan kondisi perusahaan secara lebih tepat.

---

## 4. Keputusan Utama: Transaction-First

Pendekatan awal UI masih berorientasi pada akuntansi atau **accounting-first**. Pengguna diminta memilih akun debit dan kredit melalui menu Input Transaksi.

Pendekatan tersebut belum menyelesaikan masalah utama pengguna.

Keputusan terbaru adalah mengubah alur menjadi **transaction-first**:

> Pengguna mencatat kejadian bisnis satu kali. Sistem membentuk jurnal double-entry secara otomatis di belakang layar.

Double-entry tetap digunakan sebagai fondasi akuntansi, tetapi pengguna operasional tidak perlu mengetik debit dan kredit secara manual.

Alur utama yang disepakati:

```text
TRANSAKSI BISNIS
Penjualan · Pembelian · Pengeluaran
        ↓
DOKUMEN
Invoice · Tagihan · Bukti Pengeluaran
        ↓
PEMBAYARAN
Tunai · Transfer · Kredit · Cicilan
        ↓
JURNAL OTOMATIS
        ↓
UTANG · PIUTANG · BUKU BESAR
        ↓
LAPORAN DAN DASHBOARD
```

---

## 5. Modul Transaksi yang Dibutuhkan

### 5.1 Penjualan

Digunakan untuk mencatat penjualan tali, biji plastik, dan penjualan lainnya.

Informasi utama:

- Nomor invoice.
- Tanggal penjualan.
- Customer.
- Produk.
- Kuantitas dalam kilogram.
- Harga per kilogram.
- Subtotal dan total.
- Penjualan tunai atau kredit.
- Tanggal jatuh tempo.
- Status pembayaran.
- Penerimaan pembayaran.

Status dokumen:

- Draft.
- Belum dibayar.
- Dibayar sebagian.
- Lunas.
- Jatuh tempo.
- Dibatalkan.

Untuk penjualan kredit, sistem langsung membentuk piutang ketika invoice diposting.

#### Metode pembayaran invoice

Metode pembayaran pada invoice penjualan dibatasi menjadi:

- Cash.
- Bank.
- Piutang.

Termin dan tanggal jatuh tempo hanya ditampilkan jika metode yang dipilih adalah Piutang.

Invoice dengan termin dapat memiliki:

- DP baru yang diterima saat pembuatan invoice.
- Penggunaan saldo deposit pelanggan secara otomatis.
- Sisa nilai yang dicatat sebagai piutang.

Satu customer tidak boleh memiliki saldo deposit dan piutang terbuka secara bersamaan. Jika customer memiliki deposit, sistem harus memotong deposit tersebut secara otomatis saat transaksi penjualan dibuat sebelum membentuk sisa piutang.

#### Deposit pelanggan

Deposit pelanggan dapat diterima **tanpa adanya penjualan atau invoice terlebih dahulu**. Pelanggan dapat menyimpan uang di perusahaan untuk digunakan pada transaksi berikutnya.

Deposit yang diterima sebelum digunakan pada invoice dicatat sebagai kewajiban, bukan sebagai pendapatan.

```text
Saat deposit diterima:
Debit  Bank
Kredit Deposit Pelanggan

Saat deposit digunakan pada invoice:
Debit  Deposit Pelanggan
Debit  Piutang Usaha, jika masih ada sisa
Kredit Penjualan

Saat deposit dikembalikan:
Debit  Deposit Pelanggan
Kredit Bank
```

Deposit menjadi modul mandiri, bukan hanya bagian dari Penjualan. Sistem menyimpan kartu deposit per customer yang berisi:

- Deposit masuk.
- Deposit yang digunakan pada invoice.
- Deposit yang dikembalikan.
- Saldo deposit tersedia.
- Referensi invoice atau pembayaran terkait.

### 5.2 Pembelian

Digunakan untuk mencatat:

- Pembelian bahan baku.
- Pembelian sparepart.
- Pembelian bahan pendukung.
- Pembelian aset.
- Pembelian lainnya.

Informasi utama:

- Nomor tagihan atau invoice supplier.
- Tanggal pembelian.
- Supplier.
- Kategori pembelian.
- Item.
- Kuantitas.
- Harga.
- Total.
- Pembelian tunai atau kredit.
- Tanggal jatuh tempo.
- Status pembayaran.
- Pembayaran kepada supplier.

Pembelian tidak perlu dipisahkan menjadi banyak menu. Satu menu Pembelian dapat menggunakan kategori untuk membedakan bahan baku, sparepart, bahan pendukung, aset, dan lainnya.

Untuk pembelian kredit, sistem langsung membentuk utang ketika tagihan diposting.

Metode pembayaran pembelian dibatasi menjadi Cash, Bank, atau Utang. Termin dan tanggal jatuh tempo hanya ditampilkan jika metode yang dipilih adalah Utang.

### 5.3 Pengeluaran

Digunakan untuk biaya yang tidak memerlukan proses pembelian barang.

Contoh:

- Listrik.
- Transportasi.
- Maintenance.
- Sewa.
- Konsumsi.
- Keamanan.
- Administrasi bank.
- Legal dan perizinan.
- Biaya operasional lainnya.

Informasi utama:

- Nomor bukti.
- Tanggal.
- Kategori biaya.
- Penerima pembayaran.
- Deskripsi.
- Nominal.
- Metode pembayaran.
- Akun kas atau bank.
- Lampiran bukti.

### 5.4 Kas & Bank

Digunakan untuk:

- Penerimaan pembayaran piutang.
- Pembayaran utang.
- Penerimaan uang lainnya.
- Pengeluaran uang lainnya.
- Transfer antarbank.
- Penarikan atau pengisian petty cash.
- Melihat mutasi dan saldo akun kas/bank.

Pembayaran harus ditautkan ke dokumen asal jika berkaitan dengan invoice penjualan atau tagihan pembelian.

### 5.5 Jurnal Manual

Jurnal manual tetap tersedia, tetapi bukan jalur utama pencatatan transaksi.

Jurnal manual hanya digunakan oleh Finance untuk:

- Jurnal penyesuaian.
- Koreksi akuntansi.
- Reklasifikasi akun.
- Jurnal penutup.
- Transaksi khusus yang belum memiliki modul.

---

## 6. Master Data Tambahan yang Dibutuhkan

Pendekatan transaction-first memerlukan master data berikut:

### Customer

- Kode customer.
- Nama.
- Alamat dan kontak.
- NPWP jika diperlukan.
- Termin pembayaran.
- Batas kredit jika diperlukan.
- Status aktif.

### Supplier

- Kode supplier.
- Nama.
- Alamat dan kontak.
- NPWP jika diperlukan.
- Termin pembayaran.
- Status aktif.

### Produk dan Item

- Tali.
- Biji plastik.
- Bahan baku.
- Sparepart.
- Bahan pendukung.
- Item lainnya.

Setiap produk atau kategori transaksi nantinya dipetakan ke akun akuntansi agar jurnal dapat dibuat otomatis.

---

## 7. Hubungan Antarmodul

### Penjualan kredit

```text
Invoice Penjualan
    ↓
Pendapatan + Piutang
    ↓
Penerimaan Pembayaran
    ↓
Piutang Berkurang + Kas Bertambah
```

### Pembelian kredit

```text
Tagihan Pembelian
    ↓
Persediaan/Beban/Aset + Utang
    ↓
Pembayaran Supplier
    ↓
Utang Berkurang + Kas Berkurang
```

### Pengeluaran tunai

```text
Bukti Pengeluaran
    ↓
Beban Bertambah + Kas Berkurang
```

### Jurnal dan laporan

```text
Penjualan · Pembelian · Pengeluaran · Pembayaran
                         ↓
                   Jurnal Otomatis
                         ↓
              Buku Besar · Utang · Piutang
                         ↓
             Laba Rugi · Neraca · Arus Kas
                         ↓
                      Dashboard
```

---

## 8. Perubahan Arah UI

UI sebelumnya memiliki menu utama **Input Transaksi**, dengan pilihan akun debit dan kredit.

UI perlu disesuaikan agar menu utama transaksi menjadi:

- Penjualan.
- Pembelian.
- Pengeluaran.
- Kas & Bank.
- Jurnal Manual.
- Jurnal Umum.

Utang dan Piutang tetap tersedia sebagai sub-ledger dan monitoring, tetapi data utamanya berasal dari dokumen penjualan dan pembelian.

Pengguna Finance tidak perlu membuat ulang kartu utang atau piutang jika transaksi asal sudah dicatat.

Customer dan Supplier juga menjadi menu mandiri pada sidebar. Menu ini berfungsi sebagai pusat monitoring hubungan keuangan, bukan hanya master data di Setup.

- Customer menampilkan total penjualan, pembayaran, piutang, dan deposit per customer.
- Supplier menampilkan total pembelian, pembayaran, dan utang per supplier.
- Master Customer dan Supplier tetap dapat dikelola dari Setup.

---

## 9. Kondisi Terkini Proyek

Diperbarui 17 September 2026.

### Sudah tersedia

**Frontend**

- Vite, React 19, TypeScript, Tailwind CSS, React Router.
- Struktur folder berbasis fitur: `app/`, `components/`, `features/`, `lib/`, `services/`, `mocks/`, `types/`.
- Sidebar sudah mengikuti pendekatan transaction-first.
- Halaman Penjualan, Pembelian, Pengeluaran, Kas & Bank, dan Deposit Pelanggan.
- Customer dan Supplier sebagai menu mandiri.
- Utang dan Piutang sebagai sub-ledger, bukan tempat input transaksi.
- Jurnal Manual khusus penyesuaian dan koreksi.
- Halaman login, penjaga route, dan menu keluar.

**Backend**

- Laravel 13, PHP 8.5, MySQL.
- Autentikasi token Bearer memakai Laravel Sanctum.
- Endpoint `POST /api/login`, `GET /api/me`, `POST /api/logout`, `POST /api/logout-all`.
- Kolom `role` pada tabel user dengan lima peran, serta kolom `is_active` dan `last_login_at`.
- Akun Super Admin dibuat oleh seeder dengan kredensial dari `.env`.
- Pembatasan lima percobaan login dan penolakan akun nonaktif.

### Belum diimplementasikan

- Penyimpanan transaksi dan posting jurnal otomatis.
- Kalkulasi akuntansi dan laporan dari data sebenarnya.
- Matriks hak akses per modul. Peran sudah tersimpan, tetapi belum membatasi apa pun.
- Approval, audit trail, dan closing periode.
- Export dan upload sebenarnya.

Seluruh halaman modul masih membaca mock data pada `src/mocks`. Hanya autentikasi yang
sudah tersambung ke API.

---

## 10. Tujuan Penyesuaian UI Berikutnya

Penyesuaian UI berikutnya bertujuan agar bentuk aplikasi sesuai dengan proses kerja Finance yang sebenarnya:

1. Pengguna mencatat transaksi bisnis, bukan akun debit dan kredit.
2. Penjualan kredit langsung menghasilkan piutang.
3. Pembelian kredit langsung menghasilkan utang.
4. Pembayaran ditautkan ke invoice atau tagihan terkait.
5. Pengguna tidak perlu melakukan input ulang.
6. Jurnal dibentuk otomatis dan dapat dilihat oleh Finance.
7. Laporan berasal dari seluruh transaksi di satu sistem.

Definisi singkat arah produk terbaru:

> Triplastindo Finance adalah aplikasi pencatatan transaksi bisnis dan keuangan berbasis akrual. Penjualan, pembelian, pengeluaran, dan pembayaran dicatat satu kali, kemudian sistem membentuk jurnal dan laporan secara otomatis.
