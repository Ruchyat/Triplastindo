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
- Chart of Accounts beserta kategorinya, tersemai dengan 125 akun default Triplastindo.
- Tabel jurnal, baris jurnal, dan periode buku.
- `JournalPoster` sebagai satu-satunya pintu masuk jurnal ke database.
- Master customer dan produk, beserta pemetaan produk ke akun pendapatan.
- Modul Penjualan lengkap: invoice, jurnal otomatis, piutang, dan pembatalan.
- Endpoint API untuk COA, master data, Jurnal Umum, dan Penjualan.
- Halaman Penjualan tab Invoice sudah membaca dan menulis ke database.
- Halaman Jurnal Umum sudah membaca jurnal sebenarnya beserta baris debit-kreditnya.
- Penerimaan pembayaran: siklus akrual Penjualan sudah tertutup.
- Deposit pelanggan beserta aturan potong-otomatisnya pada invoice kredit.
- Modul Penjualan lengkap; mock penjualan dan deposit sudah dihapus.
- Modul Pembelian: tagihan supplier dengan kategori yang menentukan akunnya.

### Belum diimplementasikan

- Modul Pembelian, Pengeluaran, Kas & Bank, dan Deposit Pelanggan.
- Penerimaan pembayaran atas invoice yang sudah terbit.
- Kalkulasi akuntansi dan laporan dari data sebenarnya.
- Matriks hak akses per modul. Peran sudah tersimpan, tetapi belum membatasi apa pun.
- Approval, audit trail, dan closing periode.
- Export dan upload sebenarnya.

Selain Login dan Penjualan tab Invoice, halaman modul masih membaca mock data pada
`src/mocks`.

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

---

## 11. Keputusan Fondasi Akuntansi

Diputuskan 17 September 2026, saat membangun tabel jurnal.

**Jurnal hanya boleh dibuat lewat satu pintu.** Seluruh aturan yang membuat
pembukuan dapat dipercaya — debit sama dengan kredit, akun terdaftar dan aktif,
nominal positif, periode terbuka — berkumpul di `JournalPoster`. Model
`JournalEntry` dan `JournalLine` sengaja tidak dapat diisi massal, sehingga
tidak ada modul yang dapat menulis jurnal dengan melewati pemeriksaan itu.
Alasannya: aturan yang disalin ke sepuluh modul akan berbeda isi di modul
kesebelas.

**Nilai uang disimpan sebagai `decimal(18,2)` dan dikirim sebagai string.**
Bukan float. Penjumlahan float tidak selalu menghasilkan angka yang persis, dan
pada jurnal selisih satu sen berarti transaksi ditolak. Perhitungannya memakai
`bcmath`, bukan operator aritmetika biasa.

**Tagging arus kas disimpulkan sistem, bukan diisi pengguna.** Jurnal yang
menyentuh akun berkategori Kas & Bank ditandai `kas_bank`. Di Google Sheet
kolom ini diisi manual, dan itulah sumber kesalahan yang mudah terjadi pada
Laporan Arus Kas.

**Bulan yang belum pernah ditutup tidak memiliki baris di `fiscal_periods`.**
Aplikasi hanya mencatat bulan yang pernah ditutup. Dengan begitu tidak perlu
menyemai seluruh bulan di muka hanya agar jurnal dapat masuk, dan tidak ada
bulan yang tanpa sengaja terkunci karena barisnya belum dibuat.

**Asal jurnal disimpan sebagai enum `source` plus `source_id`, bukan relasi
polimorfik Eloquent.** Kolomnya tetap terbaca sebagai data ketika tabel dibuka
langsung, bukan sebagai nama kelas PHP yang ikut berubah bila kelasnya
dipindahkan.

**Jurnal turunan dokumen tidak dapat disunting langsung.** Memperbaikinya
dilakukan dengan mengubah dokumen asalnya. Bila jurnal dapat disunting
terpisah, dokumen dan jurnal akan dapat berbeda isi, dan tidak ada cara
menentukan mana yang benar.

**Jurnal dihapus dengan soft delete dan nomornya tidak dipakai ulang.** Nomor
bukti yang hilang dari urutan adalah petunjuk audit; nomor yang dipakai ulang
menghilangkan petunjuk itu.

---

## 12. Keputusan Modul Penjualan

Diputuskan 17 September 2026, saat mengerjakan modul transaksi pertama.

**Frontend tidak pernah mengirim total.** Yang dikirim hanya kuantitas dan
harga per baris; subtotal, total, jatuh tempo, nomor invoice, dan seluruh baris
jurnal dihitung backend. Angka yang dihitung di dua tempat cepat atau lambat
akan berbeda di dua tempat, dan yang masuk pembukuan harus yang satu itu saja.
Perhitungan di form hanya untuk ditampilkan sebelum disimpan.

**Produk membawa pemetaan akunnya sendiri.** Pengguna memilih "Tali", sistem
tahu pendapatannya masuk ke `4-10000`. Tanpa pemetaan ini pengguna kembali
harus memilih akun sendiri — persis yang ingin dihindari pendekatan
transaction-first. Produk tanpa pemetaan jatuh ke akun penjualan lain-lain,
bukan gagal, supaya tidak ada transaksi yang tertahan hanya karena master data
belum rapi.

**Draft tidak menghasilkan jurnal sama sekali.** Tombol "Simpan Draft" benar-benar
menyimpan dokumen tanpa membentuk jurnal, sehingga angkanya belum masuk laporan
mana pun. Ini berbeda dari menyimpan jurnal dengan penanda "belum final", yang
akan membuat setiap laporan harus ingat menyaringnya.

**Invoice yang sudah diposting tidak dapat dihapus, hanya dibatalkan, dan
jurnalnya dibalik.** Pembukuan yang sudah dibaca orang lain tidak boleh berubah
diam-diam.

**Status jatuh tempo tidak disimpan.** Ia disimpulkan dari tanggal jatuh tempo
saat dibaca. Menyimpannya berarti butuh penjadwal yang memutakhirkan status
setiap hari, dan status akan salah setiap kali penjadwal itu tidak jalan.

**Akun penerima pembayaran dipilih pengguna, bukan ditebak sistem.** Metode
"Bank" saja tidak cukup — perusahaan punya BCA, BNI, BRI, dan Giro, dan jurnal
harus menunjuk rekening yang benar.

**Pemeriksaan dibagi tiga lapis.** FormRequest memeriksa bentuk permintaan,
`SalesInvoicePoster` memeriksa aturan penjualan, `JournalPoster` memeriksa
aturan akuntansi. Dengan begitu aturan penjualan tetap berlaku bagi pemanggil
yang bukan HTTP — impor data dan perintah artisan — dan aturan akuntansi
berlaku untuk seluruh modul sekaligus.

**Jurnal ditampilkan per baris akun, bukan per transaksi.** Satu baris tabel
Jurnal Umum adalah satu sisi debit atau kredit — bentuk yang sama dengan tab
JURNAL UMUM di Google Sheet. Menggabungkan satu transaksi menjadi satu baris
dengan kolom Debit berisi totalnya membuat jurnal tiga baris terbaca seperti
jurnal dua baris (17 September 2026).

**Tabel Jurnal Umum tidak memakai baris kepala transaksi.** Baris kepala
memecah tabel menjadi dua jenis baris dan memaksa mata berpindah-pindah saat
menyisir data. Sebagai gantinya nomor bukti dan tanggal ditulis sekali di baris
pertama tiap transaksi lalu dikosongkan di bawahnya, dengan garis tebal
menandai pergantian transaksi (18 September 2026).

**Detail transaksi muncul sebagai accordion di dalam tabel, bukan panel
samping.** Panel samping menutupi tabel dan membuat pemeriksa kehilangan posisi
barisnya; untuk menyisir ratusan baris, membuka-tutup beberapa baris berturut-turut
harus tetap berada di dalam tabel. Panel samping tetap tepat untuk menampilkan
satu dokumen utuh, bukan untuk menelusuri banyak baris (18 September 2026).

**Nomor dokumen asal selalu terlihat tanpa diklik**, di bawah nomor bukti pada
baris pertama tiap transaksi. Pencocokan nomor invoice adalah pemeriksaan yang
paling sering dilakukan, sehingga tidak pantas menuntut satu klik. Nomornya
menjadi tautan ke halaman Penjualan dengan pencarian sudah terisi.

**Baris jurnal disimpan debit dulu, baru kredit.** Urutan baku pembacaan
jurnal. Pengurutannya dilakukan saat posting, bukan saat ditampilkan, supaya
jurnal manual tetap mempertahankan urutan yang diketik pengguna.

**Detail dokumen memakai panel samping, Jurnal Umum memakai accordion.** Keduanya
sengaja berbeda karena pekerjaannya berbeda: detail invoice adalah membaca satu
dokumen utuh, sedangkan Jurnal Umum adalah menyisir banyak baris. Panel cocok
untuk yang pertama dan mengganggu untuk yang kedua (18 September 2026).

**Tombol tindakan disembunyikan mengikuti status dokumen**, bukan ditampilkan
lalu ditolak backend. Invoice draft menawarkan Posting dan Hapus; yang sudah
diposting hanya menawarkan Batalkan. Backend tetap memeriksanya sendiri —
tombolnya disembunyikan agar pengguna tidak mencoba sesuatu yang pasti gagal.

---

## 13. Keputusan Penerimaan Pembayaran

Diputuskan 18 September 2026.

**Satu bukti penerimaan dapat melunasi beberapa invoice sekaligus.** Customer
umumnya mentransfer satu jumlah untuk beberapa tagihan. Model satu-lawan-satu
memaksa pencatat memecah transfer itu secara buatan, dan jejaknya tidak lagi
cocok dengan mutasi bank yang sebenarnya.

**Nilai bukti dijumlahkan dari alokasinya, tidak diketik terpisah.** Bila
keduanya diisi sendiri-sendiri, akan ada saat total bukti dan rincian
pelunasannya berbeda, dan tidak ada cara menentukan mana yang benar.

**Jurnal penerimaan memakai satu baris kredit untuk seluruh invoice**, bukan
satu baris per invoice. Semuanya bermuara ke akun Piutang Usaha yang sama, dan
rincian per invoicenya sudah tercatat pada alokasi — memecahnya hanya
memperpanjang jurnal tanpa menambah informasi.

**Invoice yang sudah menerima pembayaran tidak dapat dibatalkan.** Penerimaannya
harus dibatalkan lebih dahulu. Membatalkan invoicenya saja akan menyisakan uang
yang sudah masuk tanpa dokumen yang menjelaskannya.

**Pembatalan penerimaan membalik jurnal dan mengembalikan piutang sekaligus,
dalam satu transaksi database.** Bila salah satunya gagal, sisa piutang akan
berbeda dengan jurnalnya — dan selisih itu tidak akan terlihat sampai laporan
disusun.

**Penerimaan yang dibatalkan tetap ditampilkan pada riwayat invoice**, dengan
coretan, bukan disembunyikan. Pembatalan adalah kejadian yang perlu ikut
terbaca saat menelusuri kenapa sisa piutangnya berubah.

---

## 14. Keputusan Modul Deposit Pelanggan

Diputuskan 18 September 2026.

**Saldo deposit tidak disimpan sebagai satu angka per customer, melainkan
dihitung dari mutasinya.** Saldo yang disimpan akan mudah berbeda dari
riwayatnya begitu ada satu pembatalan yang gagal ikut memperbaruinya, dan
selisihnya tidak akan terlihat sampai ada yang mencocokkan keduanya.

**Deposit dicatat sebagai kewajiban** pada `2-10007 Pendapatan Diterima Dimuka`,
bukan pendapatan. Barangnya belum diserahkan, jadi uangnya belum menjadi hak
perusahaan. Pendapatan baru diakui ketika invoicenya terbit.

**Pemakaian deposit tidak punya jurnal sendiri.** Potongannya menjadi salah
satu baris debit pada jurnal invoicenya. Membuat jurnal terpisah berarti dua
jurnal untuk satu kejadian, dan Arus Kas akan menghitung perpindahan yang tidak
pernah menyentuh kas.

**Potongan berlaku pada kedua metode pembayaran.** Semula hanya penjualan
bertermin, dengan alasan "penjualan tunai sudah lunas seketika". Alasan itu
keliru: ia mengandaikan customer membayar penuh, padahal justru itu yang
dipertanyakan. Customer dengan deposit 3 juta yang membeli 5 juta secara tunai
wajarnya menyetor 2 juta saja (18 September 2026).

**Pemakaian deposit adalah keputusan pencatat, bukan kesimpulan sistem.** Kata
"otomatis" pada spesifikasi awal dicabut. Saldo deposit customer ditampilkan
saat invoice dibuat, dengan checkbox untuk menentukan dipakai atau tidak —
karena ada customer yang ingin depositnya tetap utuh dan membayar invoice
barunya terpisah, walaupun jarang. Pilihannya disimpan pada invoice agar draft
yang diposting belakangan tetap memakai keputusan yang sama.

**Mutasi pemakaian tidak dapat dibatalkan langsung.** Ia lahir dari invoicenya;
yang benar adalah membatalkan invoice itu, dan saldonya kembali dengan
sendirinya. Sebaliknya, deposit masuk yang saldonya sudah terpakai juga tidak
dapat dibatalkan — pemakaiannya harus dilepas lebih dahulu, agar saldo tidak
pernah menjadi negatif.

**Saldo piutang dan deposit per customer dihitung lewat subquery**, bukan satu
kueri agregasi per baris. Daftar customer ditampilkan utuh tanpa paginasi,
sehingga cara kedua berarti ratusan kueri sekali muat begitu master datanya
bertambah besar.

**Invoice yang sudah diposting tidak dapat disunting, dan itu disengaja.**
Koreksinya dilakukan dengan membatalkan lalu membuat ulang. Menyunting dokumen
yang jurnalnya sudah terbaca laporan berarti mengubah pembukuan diam-diam.

**Metode pembayaran invoice hanya dua: Tunai dan Piutang.** Semula tiga —
Cash, Bank, dan Piutang — padahal Cash dan Bank sama-sama meminta akun
penerima lewat dropdown Kas & Bank yang isinya identik. Pilihan itu menanyakan
hal yang sama dua kali tanpa menambah informasi apa pun. "Tunai" juga menjawab
kasus invoice yang seluruhnya tertutup saldo deposit: tidak ada uang yang
berpindah, dan itu wajar (18 September 2026).

**Akun penerima hanya wajib bila ada uang yang benar-benar masuk.** Invoice
tunai yang tertutup penuh deposit tidak memindahkan uang, sehingga tidak perlu
menunjuk rekening mana pun — dan jurnalnya pun tidak memuat baris kas.

**Halaman Deposit menampilkan daftar customer, bukan daftar mutasi.** Bentuk
awalnya adalah buku mutasi — satu baris per kejadian, mirip Jurnal Umum —
padahal yang ditanyakan sehari-hari adalah "customer ini masih punya titipan
berapa", bukan "apa yang terjadi tanggal sekian". Bentuk lama memaksa pembaca
menjumlah sendiri. Riwayat mutasinya dibuka lewat panel setelah satu customer
diklik, lengkap dengan saldo berjalan dan tautan ke jurnal serta invoicenya
(18 September 2026).

**Panel dipakai di sini, accordion dipakai di Jurnal Umum.** Keduanya berbeda
karena pekerjaannya berbeda: kartu deposit adalah satu dokumen utuh milik satu
customer, sedangkan Jurnal Umum adalah menyisir banyak baris.

**Status periode diingat selama satu permintaan**, lewat `ClosedPeriodRegistry`
yang didaftarkan sebagai singleton container. `FiscalPeriod::isClosedOn`
sebelumnya menjalankan satu kueri per baris jurnal hanya untuk menentukan
apakah barisnya masih dapat disunting, padahal status periode tidak berubah di
tengah-tengah satu permintaan.

Sengaja bukan properti statis: container dibangun ulang setiap permintaan dan
setiap test, sehingga ingatannya hilang dengan sendirinya. Properti statis akan
terbawa antar-permintaan pada proses berumur panjang, dan antar-test pada satu
proses PHPUnit — yang memang langsung terlihat sebagai satu test gagal ketika
pertama kali dicoba.

**Tindakan yang tidak dapat diurungkan memerlukan konfirmasi.** Pembatalan
invoice, pembatalan penerimaan pembayaran, pembatalan mutasi deposit, dan
penghapusan draft semuanya melewati dialog konfirmasi. Sebelumnya sekali tekan
langsung berlaku — berbahaya, apalagi tombol batalkan mutasi deposit yang
berupa teks kecil di dalam baris riwayat (18 September 2026).

Isi dialognya menyebutkan **akibatnya secara spesifik** — jurnal mana yang
dibalik, piutang siapa yang berubah dan sebesar berapa, saldo deposit mana yang
kembali — bukan pertanyaan "Anda yakin?" yang lama-lama hanya ditekan tanpa
dibaca. Fokus awal jatuh pada tombol batal dan Escape menutup dialog, sehingga
tekanan tidak sengaja pada spasi atau enter tidak berakibat apa pun.

Pesan penolakan dari backend ditampilkan **di dalam dialog**, bukan di panel di
belakangnya: dialognya menutupi panel itu, sehingga pesan di sana tidak akan
terbaca.

**Posting invoice sengaja tidak dikonfirmasi.** Ia tindakan maju yang memang
dituju pengguna, dan masih dapat diurungkan lewat pembatalan — berbeda dari
keempat tindakan di atas.

---

## 15. Keputusan Bentuk Halaman Transaksi

Diputuskan 18 September 2026.

**Form dan detail dokumen transaksi berupa halaman penuh, bukan panel geser.**
Semula panel, dengan alasan pengguna tetap melihat daftar di belakangnya.
Alasan itu kalah oleh tiga kerugian nyata:

- Satu klik di luar panel menghapus seluruh isian tanpa peringatan apa pun.
  Invoice belasan baris yang setengah diketik lenyap begitu saja.
- Panel tidak punya alamat. Refresh berarti isian hilang, dan sebuah dokumen
  tidak dapat ditautkan langsung.
- Lebarnya terkunci 576 px. Menambah kolom pada tabel item — diskon, keterangan
  per baris, satuan selain kilogram — berarti merancang ulang, bukan menambah.

Alamatnya: `/sales/invoices/new`, `/sales/invoices/:id`, `/sales/receipts/new`,
`/sales/receipts/:id`, `/customer-deposits/new`, `/customer-deposits/:customerId`.

**Siasat `?invoice=NOMOR` dihapus.** Tautan dari Jurnal Umum dulu menyaring
daftar penjualan lalu membuka panel, karena invoice tidak punya alamat sendiri.
Sekarang jurnal membawa `source_id`, sehingga tautannya langsung menunjuk
halaman dokumennya.

**Router berpindah ke `createBrowserRouter`.** `useBlocker` — yang menahan
perpindahan halaman ketika masih ada isian belum tersimpan — hanya tersedia
pada data router. `AuthProvider` pindah ke luar router karena memang tidak
memerlukan konteksnya.

**Isian yang belum tersimpan menahan kepergian.** Dua jalan keluar dijaga:
perpindahan di dalam aplikasi ditahan `useBlocker` sehingga aplikasi dapat
menampilkan dialognya sendiri, sedangkan menutup tab atau menekan refresh
dijaga `beforeunload` yang hanya dapat memunculkan dialog bawaan browser.

Penandaan "sudah tersimpan" memakai **ref, bukan state**. Menyimpan lalu
berpindah halaman terjadi dalam satu penanganan peristiwa, sedangkan perubahan
state baru berlaku pada render berikutnya — sehingga penjaga masih melihat
isian sebagai belum tersimpan dan bertanya "tinggalkan halaman ini?" tepat
setelah tombol Simpan ditekan. Halaman melepas penjagaan lewat `release()`
sesaat sebelum bernavigasi.

Panel geser tetap dipakai untuk hal yang memang sampingan. Yang tersisa
memakainya hanya `TransactionDrawer`, yang melayani modul-modul yang datanya
masih mock.

**Istilah "dilunasi" diganti "dibayar" pada penerimaan pembayaran.** Sebagian
besar penerimaan bersifat sebagian, sehingga menyebut sebuah invoice "dilunasi"
tanpa menyebut sisanya menyesatkan. Detail bukti penerimaan menampilkan nilai
yang dibayar berdampingan dengan total dan sisa piutang invoicenya; status
lunas muncul sebagai penanda tambahan, bukan sebagai judul (18 September 2026).

---

## 16. Keputusan Modul Pembelian

Diputuskan 18 September 2026.

**Kategori pembelian yang menentukan akun, bukan produk.** Penjualan selalu
bermuara ke akun pendapatan, sehingga produk cukup membawa pemetaannya sendiri.
Pembelian tidak begitu: barang yang sama bisa masuk persediaan atau langsung
menjadi beban, dan banyak yang dibeli — jasa, perlengkapan — tidak ada di
master produk sama sekali. Kategori menutup seluruh kemungkinan itu.

**Kategorinya berlaku per tagihan, bukan per baris.** Mengikuti spesifikasi,
yang menaruh "Kategori pembelian" sebagai informasi utama dokumen. Satu nota
supplier yang memuat bahan baku sekaligus sparepart harus dipecah menjadi dua
tagihan — itu konsekuensi yang diterima demi jurnal yang tetap sederhana.

**Karung bukan kategori tersendiri.** Karung bekas adalah bahan baku utama
pabrik ini, jadi masuk Bahan Baku; karung baru dipakai sebagai wadah barang
jadi, jadi masuk Bahan Pendukung. Karena pemasok karung bekas adalah pemasok
bahan baku utamanya, akun `2-10001 Hutang Supplier Karung` dipakai oleh
kategori Bahan Baku.

**Akun utang mengikuti kategori.** COA sudah menyediakan `2-10001` dan `2-10002`
di samping `2-10000 Hutang Usaha`; memakainya membuat Neraca menunjukkan utang
per jenis pemasok tanpa perlu membaca sub-ledger.

**Pemetaan kategori ke akun ada di konfigurasi, bukan di kode.** COA perusahaan
akan berkembang — Bahan Pendukung kelak mungkin mendapat akun persediaannya
sendiri — dan memindahkannya tidak boleh menuntut perubahan program. Frontend
pun mengambil daftarnya dari backend, bukan mendaftar ulang.

**Bentuk baris item mengikuti kategori.** Kategori persediaan meminta produk
pada tiap baris agar kartu stoknya kelak dapat mengikuti; kategori beban cukup
keterangan. Form pun berubah bentuk saat kategorinya diganti, bukan sekadar
menambah satu kolom.

**Kategori Aset Tetap sengaja belum ada.** Pembelian aset semestinya juga
membentuk kartu aset untuk penyusutan. Menjurnalnya sekarang tanpa kartu
berarti aset yang tidak pernah disusutkan, dan baru ketahuan saat laporan
disusun. Menunggu modul Aset.

**Spesifikasi kategorinya tidak ada di Google Sheet.** Keempat belas tabnya
sudah diperiksa: yang tersedia hanya COA, master aset, karyawan, dan bulan.
Daftar kategori di atas disusun dari COA lalu dikonfirmasi bersama pemilik
proses, bukan disalin dari dokumen yang sudah ada.

---

## 17. Keputusan Pembayaran Supplier

Diputuskan 18–19 September 2026.

**Cermin penuh dari Penerimaan Pembayaran.** Satu bukti (`BKK/…`) melunasi
beberapa tagihan, nilainya dijumlahkan dari alokasi, pembatalan membalik jurnal
dan mengembalikan utang. Tidak ada aturan baru; yang berbeda hanya arah uangnya.

**Sisi debit dikelompokkan per akun utang.** Tagihan bahan baku berutang ke
`2-10001`, bahan pendukung ke `2-10002`, sisanya ke `2-10000`. Satu bukti yang
membayar tagihan dari kategori berbeda menghasilkan beberapa baris debit —
supaya saldo tiap akun utang di Neraca tetap benar.

**Halaman Utang dan Piutang membaca dokumennya langsung.** Tidak ada tabel
kartu utang/piutang terpisah: barisnya adalah tagihan dan invoice itu sendiri,
dengan penyaring `status=outstanding`. Tombol *Bayar* / *Terima* membuka form
pelunasan yang sudah terisi.

---

## 18. Keputusan Pengeluaran dan Kas & Bank

**Pengeluaran menunjuk akun beban langsung, tanpa kategori perantara.** Daftar
bebannya sudah tersusun rapi di COA (kelompok HPP, Beban, Beban Lain, Pajak)
dan itulah yang dibaca di Laba Rugi. Kategori tambahan hanya menjadi lapisan
yang harus dipelihara dua kali. Akun di luar kelompok itu ditolak backend.

**Kas & Bank tidak mencatat penerimaan dan pembayaran sendiri.** Keduanya tetap
ditautkan ke invoice dan tagihan asalnya lewat modul Penjualan dan Pembelian;
halaman Kas & Bank hanya menyediakan pintasannya. Yang dicatat di sini cuma
transfer antar akun (`TRF/…`), yang memang tidak punya dokumen asal lain.

**Saldo dan mutasi kas dihitung dari jurnal.** Tidak ada saldo yang disimpan
terpisah, sehingga angka di Kas & Bank, Buku Besar, Neraca, dan Arus Kas tidak
mungkin berbeda satu sama lain.

**Transfer bersumber `cash_transfer` supaya Arus Kas mengabaikannya.** Kedua
sisinya akun kas; memasukkannya ke Arus Kas akan menggelembungkan uang masuk
dan uang keluar dengan angka yang sama.

---

## 19. Keputusan Buku Besar, Jurnal Manual, dan Master Data

**Buku Besar dan Neraca Saldo tidak menyimpan saldo.** Saldo awal adalah
jumlah seluruh baris jurnal sebelum rentang; jurnal yang dihapus tidak ikut.
Rentangnya wajib — tanpa batas, saldo awal tidak punya arti.

**Jurnal sederhana adalah jurnal majemuk dengan dua baris.** Keduanya berbagi
state; berpindah tab tidak menghilangkan isian. Yang mengunci keseimbangan
tetap `JournalPoster`, bukan form.

**Master data tidak pernah dihapus, hanya dinonaktifkan.** Dokumen lama
merujuk ke sana. Kode boleh dikosongkan dan dibuatkan mengikuti lebar kode
yang sudah ada (`CUS-005` melanjutkan `CUS-004`; `PRD-0001` bila belum ada
kode bernomor). Akun COA yang sudah dipakai jurnal tidak boleh ganti kode,
kategori, atau saldo normal — mengubahnya menggeser laporan periode lalu.

**Produk boleh dibuat dari dalam form pembelian.** Barang yang dibeli sering
belum ada di master; memaksa pencatat ke Setup lalu kembali membuat isian
tagihannya hilang. Produk baru langsung masuk ke baris item.

---

## 20. Keputusan Laporan Keuangan dan Dashboard

**Google Sheet Finance Triplastindo adalah acuan utama susunan laporan.**
Tab LAPORAN LABA RUGI, LAPORAN NERACA, LAPORAN ARUS KAS, dan DASHBOARD
dibaca langsung; susunan baris, kolom bulan/YTD, dan standar rasio disalin
dari sana.

**Laba Rugi menampilkan seluruh akun kelompoknya meski nol**, sama seperti di
sheet, agar pembaca tahu akun mana yang belum pernah bergerak. Urutannya:
Pendapatan − HPP = Laba Kotor; − Beban Operasional = Laba Operasional;
± Lain-lain = Laba Sebelum Pajak; − Pajak = Laba Bersih.

**Neraca menyajikan laba yang belum ditutup sebagai dua baris hitungan** —
laba ditahan periode lalu dan laba tahun berjalan — di bagian Ekuitas.
Tutup buku belum ada; tanpa dua baris ini neraca tidak akan seimbang.

**Kategori Arus Kas disimpulkan sistem dari akun lawan.** Di sheet kolom ini
diisi manual per jurnal, dan itulah sumber kesalahan yang paling sering.
Aturannya: lawan aset tetap → investasi; lawan ekuitas atau Kewajiban Jangka
Panjang → pendanaan; selebihnya operasi. Uang masuk operasi dianggap "dari
pelanggan" bila lawannya pendapatan, piutang, atau pendapatan diterima dimuka.

**Standar rasio diambil dari sheet apa adanya**: CR ≥ 1,2; QR ≥ 1,2;
GPM ≥ 30%; NPM ≥ 20%; DER ≤ 1,80; CFR ≥ 35%. Belum dapat diubah dari Setup.

**HPP per Kg ditunda** sampai modul Inventory ada — rumusnya membutuhkan
tonase pembelian bahan baku dan produksi biji/tali yang hanya ada di tab
SUMMARY INVENTORY & PENJUALAN.

**Dashboard tidak menghitung sendiri.** Semua angkanya dirangkai backend dari
laporan yang sama, sehingga KPI di Dashboard selalu sama dengan Laba Rugi,
Neraca, dan Arus Kas untuk periode yang sama.

---

## 21. Keputusan Aset & Depresiasi

**Jenis aset memetakan tiga akun sekaligus.** Aset, akumulasi, dan beban
penyusutan ditentukan jenisnya (spesifikasi 5.13), sehingga pengguna hanya
memilih jenis; jurnal penyusutannya tersusun sendiri, satu jurnal per jenis
per bulan.

**Garis lurus, residu 1% (parameter), berhenti di nilai residu.** Rumusnya
persis tab ASET & DEPRESIASI. Penyusutan dijalankan per bulan secara
berurutan dan hanya bulan terakhir yang dapat dibatalkan — sama seperti tutup
buku, supaya akumulasinya tidak berlubang di tengah.

**Tiga cara mencatat aset.** Saldo awal (tanpa jurnal, nilainya sudah ada di
saldo awal neraca), beli tunai, atau beli bertermin. Kategori pembelian aset
di modul Pembelian sengaja tetap tidak ada; aset dicatat di modulnya sendiri
agar selalu punya kartu untuk disusutkan.

---

## 22. Keputusan Payroll dan Bagi Hasil

**Rumus payroll disalin dari sheet.** Kotor = pokok + lembur + allowance +
bonus; bersih = kotor − PPh 21 − BPJS; THP = bersih + pinjaman kasbon −
potongan kasbon. PPh 21 dan BPJS diinput manual, seperti di sheet.

**Kasbon adalah piutang karyawan, bukan beban.** Pinjaman mendebit `1-10103`,
potongan mengkreditnya; sisa kasbon per karyawan dihitung dari situ. BPJS
yang dipotong dari karyawan ditampung `2-10006 Biaya Masih Harus Dibayar`
sampai disetorkan.

**Dividen: Finance mengajukan, Direksi menyetujui.** Jurnal baru terbentuk
saat disetujui — D Dividen · K Hutang PPh Final (pajak final) · K Kas. Check
point kas tidak menghalangi pengajuan; ia peringatan untuk Direksi.

**Dividen adalah akun kontra ekuitas.** Ini yang memaksa laporan membaca
saldo dari sisi laporannya (aset: debit − kredit; liabilitas/ekuitas: kredit
− debit), bukan dari saldo normal akun — kalau tidak, Dividen menambah ekuitas
dan Retur Penjualan menambah pendapatan.

---

## 23. Keputusan Inventory

**Kartu stok dalam Kg, otomatis dari dokumen.** Tagihan pembelian persediaan
dan invoice penjualan mengisinya saat diposting; yang diinput manual hanya
pemakaian bahan, hasil produksi, saldo awal, dan penyesuaian.

**Pemakaian bahan dijurnal ke HPP saat dipakai; hasil produksi tidak
dijurnal.** Mengikuti cara sheet: `5-10000 Pemakaian Bahan Baku` adalah HPP,
dan nilai barang jadi dihitung dari HPP/kg × sisa Kg untuk ditampilkan, bukan
diposting. Kapitalisasi WIP/barang jadi, bila kelak diperlukan, dapat
dilakukan lewat jurnal manual akhir periode.

**HPP per Kg = HPP Produksi tahun berjalan ÷ Kg hasil produksi.** Disandingkan
dengan harga jual rata-rata per Kg dan beban operasional per Kg terjual.

---

## 24. Keputusan Setup, Hak Akses, dan Data Contoh

**Saldo awal adalah satu jurnal bersumber `opening_balance`.** Akun diisi
searah saldo normalnya; selisih ke `3-10006 Saldo Penyesuaian Awal Ekuitas`.
Hanya akun neraca. Jurnalnya dapat dihapus di Jurnal Umum bila salah.

**Tutup buku berurutan, buka kembali hanya Super Admin.** JournalPoster sudah
menolak jurnal pada bulan tertutup sejak awal; yang ditambahkan adalah
pintunya.

**Hak akses ditegakkan backend, frontend hanya menyembunyikan.** Middleware
`role:` per grup rute mengikuti matriks spesifikasi; sidebar dan tombol
membaca matriks yang sama (`features/auth/permissions.ts`).

**Data contoh hanya lingkungan lokal.** `DemoDataSeeder` menyemai saldo awal
per 1 April 2026 (angka tab NERACA), aset dari tab ASET & DEPRESIASI,
karyawan dan pemegang saham dari tab SETUP, lalu transaksi April–September
lewat service yang sama dengan aplikasi. Sebelum dipakai sungguhan: reset,
lalu input saldo awal dan master data sebenarnya. COA, produk, customer, dan
supplier dari seeder lain tetap dipertahankan.
