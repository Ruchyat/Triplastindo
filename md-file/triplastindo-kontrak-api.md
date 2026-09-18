# Triplastindo Finance — Kontrak API

> Bentuk permintaan dan jawaban antara frontend dan backend.
> Disusun 17 September 2026.

Dokumen ini ditulis **sebelum** endpointnya dibuat, supaya frontend dan backend
menyepakati bentuk datanya lebih dulu. Endpoint yang sudah berjalan ditandai
**Tersedia**; sisanya adalah rencana yang masih boleh berubah selama belum
dikerjakan.

---

## 1. Konvensi

### Alamat dan autentikasi

Seluruh endpoint berawalan `/api`. Frontend memanggilnya secara relatif pada
origin yang sama; Vite meneruskannya ke Valet (lihat
`triplastindo-lingkungan-pengembangan.md`).

Kecuali `POST /login`, semua endpoint memerlukan header:

```http
Authorization: Bearer <token>
Accept: application/json
```

### Bentuk jawaban

Satu objek dibungkus `data`, mengikuti bawaan Laravel Resource:

```json
{ "data": { "id": 1, "code": "1-10001", "name": "Kas" } }
```

Daftar berisi `data`, `links`, dan `meta` bawaan paginator. Tindakan yang tidak
mengembalikan data menjawab dengan `{ "message": "..." }`.

### Bentuk kesalahan

| Kode | Arti | Bentuk |
|---|---|---|
| `401` | Token tidak ada, salah, atau sudah dicabut | `{ "message": "..." }` |
| `403` | Token sah tetapi peran tidak berhak | `{ "message": "..." }` |
| `404` | Data tidak ditemukan | `{ "message": "..." }` |
| `422` | Validasi gagal, termasuk pelanggaran aturan akuntansi | `{ "message": "...", "errors": { "field": ["..."] } }` |
| `429` | Terlalu banyak percobaan | `{ "message": "..." }` |

Pelanggaran aturan akuntansi — jurnal tidak seimbang, akun nonaktif, periode
tertutup — dijawab `422` dengan pesan berbahasa Indonesia yang siap ditampilkan
apa adanya. Frontend tidak perlu menerjemahkan kode kesalahan.

### Tipe data

| Jenis | Bentuk | Contoh |
|---|---|---|
| Tanggal | `YYYY-MM-DD` | `"2026-09-17"` |
| Waktu | ISO 8601 | `"2026-09-17T08:15:00+07:00"` |
| Uang | **String** dua desimal | `"1500000.00"` |
| Enum | Nilai mesin + label siap tampil | `"kas_bank"` + `"Kas & Bank"` |

Nilai uang dikirim sebagai string, bukan angka. `JSON.parse` di JavaScript
mengubah angka menjadi `double`, dan nilai rupiah yang besar dapat kehilangan
ketepatan di sana. Frontend memformat string itu untuk ditampilkan, dan
mengirimkannya kembali sebagai string pula.

### Penyaringan dan halaman

Parameter yang berlaku umum pada endpoint daftar:

```
?page=2&per_page=25&search=bahan+baku&from=2026-09-01&to=2026-09-30&sort=-date
```

`per_page` maksimal 100. `sort` diawali `-` untuk urutan menurun.

---

## 2. Autentikasi — **Tersedia**

| Metode | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/api/login` | Publik. Dibatasi 5 percobaan gagal per email+IP per menit. |
| `GET` | `/api/me` | User yang sedang masuk. |
| `POST` | `/api/logout` | Mencabut token yang sedang dipakai. |
| `POST` | `/api/logout-all` | Mencabut seluruh token user. |

```http
POST /api/login
{ "email": "admin@triplastindo.com", "password": "...", "device_name": "web" }
```

```json
{
  "token": "3|xxxxxxxx",
  "user": {
    "id": 1, "name": "Super Admin", "email": "admin@triplastindo.com",
    "role": "super_admin", "role_label": "Super Admin",
    "is_active": true, "last_login_at": "2026-09-17T08:15:00+07:00"
  }
}
```

Email tidak dikenal dan kata sandi salah menghasilkan pesan yang persis sama,
agar tidak dapat dipakai menebak email mana yang terdaftar.

---

## 3. Chart of Accounts

| Metode | Endpoint | Status | Keterangan |
|---|---|---|---|
| `GET` | `/api/account-categories` | **Tersedia** | 15 kategori beserta kelompok dan laporannya. |
| `GET` | `/api/accounts` | **Tersedia** | Daftar akun. Filter: `category_id`, `is_active`, `is_cash`, `search`. |
| `POST` | `/api/accounts` | *rencana* | Membuat akun. |
| `PUT` | `/api/accounts/{id}` | *rencana* | Mengubah akun. |
| `DELETE` | `/api/accounts/{id}` | *rencana* | Hanya untuk akun yang belum pernah dipakai di jurnal. |

Daftar akun **tidak dipaginasi**: COA hanya berisi ratusan baris, jarang
berubah, dan frontend memakainya sekaligus sebagai isi dropdown. Memaginasinya
justru memaksa frontend mengambil seluruh halaman satu per satu.

```json
{
  "data": {
    "id": 3,
    "code": "1-10003",
    "name": "Bank BCA",
    "label": "1-10003 · Bank BCA",
    "category": { "id": 1, "name": "Kas & Bank", "group": "aset_lancar", "statement": "neraca" },
    "normal_balance": "debit",
    "is_cash": true,
    "is_active": true,
    "is_deletable": false
  }
}
```

Aturan yang dijaga backend:

- `code` unik dan berformat `X-XXXXX`.
- Akun yang sudah muncul di jurnal **tidak dapat dihapus**, hanya dinonaktifkan.
  Menghapusnya akan memutus jejak transaksi lama.
- `is_cash` diturunkan dari kategori, bukan diisi pengguna.

Form dropdown akun cukup memanggil `GET /api/accounts?is_active=1` sekali lalu
menyimpannya, karena COA jarang berubah.

---

## 4. Jurnal Umum

| Metode | Endpoint | Status | Keterangan |
|---|---|---|---|
| `GET` | `/api/journal-entries` | **Tersedia** | Daftar jurnal, berhalaman. Filter: `from`, `to`, `account_id`, `tagging`, `source`, `search`. |
| `GET` | `/api/journal-entries/summary` | **Tersedia** | Total debit, total kredit, jumlah jurnal, dan jumlah jurnal tidak seimbang untuk filter yang sama. |
| `GET` | `/api/journal-entries/{id}` | **Tersedia** | Satu jurnal beserta barisnya. |
| `POST` | `/api/journal-entries` | **Tersedia** | **Hanya jurnal manual.** |
| `DELETE` | `/api/journal-entries/{id}` | **Tersedia** | Soft delete, jejaknya tetap tersimpan. |
| `PUT` | `/api/journal-entries/{id}` | *rencana* | Hanya jurnal manual pada periode terbuka. |

```http
POST /api/journal-entries
{
  "date": "2026-09-17",
  "description": "Penjualan tali tunai",
  "payment_method": "Transfer BCA",
  "lines": [
    { "account_code": "1-10003", "debit": "1500000.00", "credit": "0.00", "description": "Masuk BCA" },
    { "account_code": "4-10000", "debit": "0.00", "credit": "1500000.00" }
  ]
}
```

```json
{
  "data": {
    "id": 12,
    "number": "JU/2026/09/0001",
    "date": "2026-09-17",
    "description": "Penjualan tali tunai",
    "tagging": "kas_bank",
    "tagging_label": "Kas & Bank",
    "source": "manual",
    "source_label": "Jurnal Manual",
    "source_id": null,
    "source_number": null,
    "payment_method": "Transfer BCA",
    "total_debit": "1500000.00",
    "total_credit": "1500000.00",
    "is_editable": true,
    "created_by": { "id": 1, "name": "Super Admin" },
    "lines": [
      {
        "id": 23,
        "account": { "id": 3, "code": "1-10003", "name": "Bank BCA" },
        "debit": "1500000.00",
        "credit": "0.00",
        "description": "Masuk BCA"
      }
    ]
  }
}
```

### Aturan yang dijaga backend

Seluruhnya dijawab `422` bila dilanggar:

1. Sedikitnya dua baris, dan sedikitnya satu di tiap sisi.
2. Total debit sama persis dengan total kredit.
3. Setiap baris bernominal lebih besar dari nol, hanya pada satu sisi.
4. Setiap akun terdaftar dan berstatus aktif.
5. Tanggal jurnal berada pada bulan yang belum ditutup.

`source_number` berisi nomor dokumen asalnya — `INV/2026/09/0001` — dan kosong
untuk jurnal manual. Nomor itu **disalin ke tabel jurnal**, bukan diambil lewat
relasi ke tabel dokumennya: nomor dokumen tidak pernah berubah setelah dibuat
sehingga salinannya tidak akan basi, dan Jurnal Umum menampilkannya di setiap
transaksi sehingga mengambilnya lewat relasi berarti satu kueri tambahan per
jenis dokumen pada setiap halaman.

Keterangan tiap baris berpola **`<jenis> · <pihak>`** — `DP · PT Tali Nusantara`,
`Piutang · PT Tali Nusantara`, `Penjualan · PT Tali Nusantara`. Nomor dokumen
tidak ikut karena sudah menjadi kolom tersendiri, sementara nama pihak membuat
tiap baris tetap dapat dibaca berdiri sendiri saat disalin atau disaring.
Baris tanpa lawan transaksi memakai pola `<jenis> · <objek>`, misalnya
`Penyusutan · Mesin Biji`.

Baris jurnal dikembalikan **debit dulu, baru kredit**, mengikuti urutan baku
pembacaan jurnal. Frontend menampilkannya apa adanya sesuai `sort_order` dan
tidak mengurutkan ulang — pada jurnal manual, urutan yang diketik pengguna ikut
dipertahankan.

Yang **tidak** dikirim frontend karena ditentukan backend:

- `number` — berurut per bulan, `JU/YYYY/MM/NNNN`.
- `tagging` — disimpulkan dari akun: menyentuh Kas & Bank berarti `kas_bank`.
- `created_by` — diambil dari token.

### Ringkasan

```json
{
  "data": {
    "total_debit": "21275000.00",
    "total_credit": "21275000.00",
    "total_entries": 1,
    "unbalanced_count": 0
  }
}
```

`unbalanced_count` seharusnya selalu nol, karena `JournalPoster` tidak
mengizinkan jurnal tidak seimbang tersimpan. Ia tetap dihitung dan ditampilkan
sebagai pemeriksaan mandiri: angka selain nol berarti ada yang menulis ke tabel
jurnal tanpa melewati poster.

Penyaring yang dipakai daftar dan ringkasan ditulis satu kali di controller,
supaya angka ringkasan tidak pernah menghitung jurnal yang berbeda dari yang
sedang ditampilkan.

### Jurnal turunan dokumen

Jurnal dengan `source` selain `manual` lahir dari modul dan **tidak dapat
disunting maupun dihapus lewat endpoint ini** (`is_editable: false`; `DELETE`
menjawab `403`). Memperbaikinya dilakukan
dengan mengubah dokumen asalnya, supaya dokumen dan jurnal tidak pernah
berbeda isi. Nilai `source` yang mungkin:

`manual` · `sale` · `purchase` · `expense` · `cash_receipt` · `cash_payment` ·
`cash_transfer` · `customer_deposit` · `payroll` · `depreciation` ·
`profit_distribution` · `opening_balance` · `period_closing`

---

## 5. Master data — **Tersedia**

| Metode | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/customers` | Daftar customer. Filter: `is_active`, `search`. `with_balance=1` ikut menghitung piutang terbukanya. |
| `GET` | `/api/products` | Daftar produk. Filter: `is_active`, `category`. |

Perubahan master data menyusul bersama modul Setup. Yang dibutuhkan sekarang
adalah daftarnya, untuk mengisi dropdown form transaksi.

Produk membawa pemetaan akunnya sendiri:

```json
{
  "id": 1, "code": "PRD-TAL", "name": "Tali",
  "category": "tali", "category_label": "Tali", "unit": "Kg",
  "revenue_account": { "id": 88, "code": "4-10000", "name": "Penjualan Tali" },
  "is_active": true
}
```

Pemetaan inilah yang membuat pengguna cukup memilih "Tali" pada invoice,
sementara sistem tahu pendapatannya masuk ke akun `4-10000`. Tanpa itu,
pengguna kembali harus memilih akun sendiri — persis yang ingin dihindari
pendekatan transaction-first.

---

## 6. Penjualan — **Tersedia**

| Metode | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/sales-invoices` | Daftar invoice, berhalaman. Filter: `from`, `to`, `customer_id`, `status`, `outstanding`, `search`. |
| `GET` | `/api/sales-invoices/summary` | Total penjualan, uang diterima, piutang terbuka, dan jumlah invoice jatuh tempo. |
| `GET` | `/api/sales-invoices/{id}` | Satu invoice beserta item dan jurnalnya. |
| `POST` | `/api/sales-invoices` | Membuat invoice. |
| `POST` | `/api/sales-invoices/{id}/post` | Memposting invoice yang masih draft. |
| `POST` | `/api/sales-invoices/{id}/cancel` | Membatalkan invoice; jurnalnya dibalik. |
| `DELETE` | `/api/sales-invoices/{id}` | Hanya untuk invoice yang masih draft. |

```http
POST /api/sales-invoices
{
  "date": "2026-09-17",
  "customer_id": 2,
  "settlement_method": "receivable",
  "cash_account_id": 3,
  "term_days": 30,
  "down_payment": "25000000",
  "use_deposit": true,
  "items": [
    { "product_id": 2, "quantity": "10000", "unit_price": "10500" }
  ],
  "post": true
}
```

Yang dikirim frontend hanyalah **kejadian bisnisnya**: siapa membeli apa,
berapa banyak, dan dibayar bagaimana. Nomor invoice, subtotal, total, tanggal
jatuh tempo, status, dan seluruh baris jurnal dihitung backend.

`post: false` menyimpan invoice sebagai draft — tersimpan, tetapi belum
menghasilkan jurnal, sehingga angkanya belum masuk laporan mana pun.

### Jurnal yang terbentuk

```text
Penjualan tunai
    D  Kas / Bank            total, dikurangi deposit yang dipakai
    D  Deposit Pelanggan     saldo deposit yang dipakai
    K  Pendapatan            per akun pendapatan produk
    K  PPN Keluaran          bila ada

Penjualan dengan termin
    D  Kas / Bank            DP
    D  Deposit Pelanggan     saldo deposit yang dipakai
    D  Piutang Usaha         sisanya
    K  Pendapatan            per akun pendapatan produk
    K  PPN Keluaran          bila ada
```

Baris yang bernilai nol tidak ditulis. Invoice tunai yang tertutup penuh oleh
deposit hanya menghasilkan dua baris: debit Deposit Pelanggan dan kredit
Pendapatan — tanpa baris kas sama sekali, karena memang tidak ada uang yang
berpindah.

Dua produk yang bermuara ke akun pendapatan yang sama digabung menjadi satu
baris jurnal; rinciannya sudah tersimpan pada item invoice.

### Metode pembayaran

Hanya dua: `cash` (**Tunai**, selesai sekarang) dan `receivable` (**Piutang**,
ditunda). Kas dan bank tidak dipisah sebagai metode — rekening penerimanya
sudah dipilih tersendiri lewat `cash_account_id`, sehingga memisahkannya di
sini hanya menanyakan hal yang sama dua kali.

"Tunai" tidak berarti uang fisik, melainkan selesai saat itu juga. Ia juga
mencakup invoice yang seluruhnya tertutup saldo deposit, sehingga tidak ada
uang yang berpindah sama sekali.

### Pemakaian saldo deposit

`use_deposit` menentukan apakah saldo deposit customer dipotong. Bawaannya
`false`: pemakaian deposit adalah keputusan pencatat, bukan kesimpulan sistem —
ada customer yang ingin saldo depositnya tetap utuh dan membayar invoice
barunya terpisah.

Berlaku untuk kedua metode. Pada penjualan tunai, deposit mengurangi uang yang
perlu diterima; pada penjualan bertermin, ia mengurangi piutang yang terbentuk.
Nilainya disimpan pada invoice, sehingga draft yang diposting belakangan tetap
memakai pilihan yang sama.

### Aturan yang dijaga backend

Seluruhnya dijawab `422`:

1. Sedikitnya satu baris produk, dengan kuantitas dan harga di atas nol.
2. Akun penerima wajib diisi **bila ada uang yang benar-benar masuk** — yaitu
   sisa setelah deposit pada penjualan tunai, atau DP pada penjualan bertermin.
   Invoice tunai yang seluruhnya tertutup deposit tidak memerlukannya.
3. Akun penerima harus akun berkategori Kas & Bank.
4. DP tidak melebihi total, dan hanya berlaku pada penjualan dengan termin.
5. Penjualan dengan termin wajib memiliki tanggal jatuh tempo — diisi langsung,
   atau dihitung dari termin.

Ditambah kelima aturan jurnal pada bagian 4, yang tetap berlaku karena
invoice pun memposting lewat `JournalPoster`.

### Status invoice

| Nilai | Arti |
|---|---|
| `draft` | Tersimpan, belum berjurnal. |
| `unpaid` | Sudah diposting, belum ada uang diterima. |
| `partial` | Sebagian dibayar, misalnya baru DP-nya. |
| `paid` | Lunas. |
| `cancelled` | Dibatalkan, jurnalnya sudah dibalik. |

`overdue` tidak pernah disimpan. Ia disimpulkan dari tanggal jatuh tempo saat
dibaca dan hanya muncul pada `display_status` — sehingga status tidak perlu
diperbarui oleh penjadwal setiap hari, dan tidak akan salah setiap kali
penjadwal itu tidak jalan.

### Pembatalan

Invoice yang sudah diposting tidak dapat dihapus, hanya dibatalkan, dan
jurnalnya **dibalik, bukan dihapus**. Pembukuan yang sudah dibaca orang lain
tidak boleh berubah diam-diam; yang benar adalah mencatat pembalikannya sebagai
kejadian tersendiri.

### Perpindahan antarhalaman

Dokumen dan jurnalnya saling menautkan lewat parameter URL, sehingga keduanya
dapat ditelusuri bolak-balik tanpa mencari manual:

```
/sales?invoice=INV/2026/09/0001          daftar tersaring, detailnya langsung terbuka
/journals?search=JU/2026/09/0001&month=2026-09   jurnalnya tersaring
```

Bulan ikut dibawa pada tautan jurnal karena filter bawaan halaman Jurnal Umum
adalah bulan berjalan, sedangkan jurnal yang dituju bisa berada di bulan lain.

### Belum tersedia pada modul ini

- Penyuntingan invoice yang sudah diposting. Koreksinya dilakukan dengan
  membatalkan lalu membuat ulang, sesuai cara kerja pembukuan: dokumen yang
  sudah masuk laporan tidak diubah diam-diam.

---

## 7. Penerimaan Pembayaran — **Tersedia**

| Metode | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/payment-receipts` | Daftar bukti penerimaan, berhalaman. Filter: `from`, `to`, `customer_id`, `status`, `search`. |
| `GET` | `/api/payment-receipts/{id}` | Satu bukti beserta alokasi dan jurnalnya. |
| `POST` | `/api/payment-receipts` | Mencatat penerimaan. |
| `POST` | `/api/payment-receipts/{id}/cancel` | Membatalkan; jurnalnya dibalik dan piutangnya dikembalikan. |

Inilah yang menutup siklus akrual penjualan: invoice membentuk piutang,
penerimaan menguranginya.

```http
POST /api/payment-receipts
{
  "date": "2026-09-18",
  "customer_id": 1,
  "cash_account_id": 3,
  "reference": "TRF-2210",
  "allocations": [
    { "sales_invoice_id": 3, "amount": "5000000" }
  ]
}
```

**Satu bukti dapat melunasi beberapa invoice sekaligus**, karena customer
umumnya mentransfer satu jumlah untuk beberapa tagihan. Karena itu alokasinya
berupa daftar, bukan satu `sales_invoice_id`.

Nilai buktinya **tidak dikirim frontend**: ia dijumlahkan dari alokasinya,
sehingga total dan rinciannya tidak mungkin berbeda. Nomornya berawalan `BKM`
— Bukti Kas Masuk.

### Jurnal yang terbentuk

```text
D  Kas / Bank        total penerimaan
K  Piutang Usaha     total penerimaan
```

Satu baris kredit untuk seluruh invoice, bukan satu baris per invoice —
semuanya bermuara ke akun piutang yang sama, dan rincian per invoicenya sudah
tercatat pada alokasi.

### Aturan yang dijaga backend

Seluruhnya dijawab `422`:

1. Sedikitnya satu invoice dialokasikan, dengan nilai di atas nol.
2. Akun penerima harus akun berkategori Kas & Bank.
3. Seluruh invoice harus milik customer yang sama dengan bukti tersebut.
4. Invoice harus sedang menunggu pembayaran — bukan draft, lunas, atau dibatalkan.
5. Nilai pelunasan tidak melebihi sisa piutang invoicenya.

### Pengaruhnya pada invoice

`paid_amount` invoice bertambah, dan statusnya ikut disesuaikan: menjadi
`partial` bila masih bersisa, `paid` bila sudah penuh. Pembatalan penerimaan
mengembalikan keduanya seperti semula.

Sejak ada modul ini, **invoice yang sudah menerima pembayaran tidak dapat
dibatalkan** — `422`, dengan pesan agar penerimaannya dibatalkan lebih dahulu.
Membatalkan invoicenya saja akan menyisakan uang yang sudah masuk tanpa
dokumen yang menjelaskannya.

Detail invoice ikut memuat `allocations`, yaitu riwayat pelunasannya.

---

## 8. Deposit Pelanggan — **Tersedia**

| Metode | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/customer-deposits/customers` | **Posisi deposit per customer** — tampilan utama halaman Deposit. |
| `GET` | `/api/customer-deposits` | Riwayat mutasi, berhalaman. Filter: `from`, `to`, `customer_id`, `movement`, `status`, `search`. |
| `GET` | `/api/customer-deposits/summary` | Saldo total, deposit masuk, dan yang terpakai atau dikembalikan. |
| `GET` | `/api/customer-deposits/{id}` | Satu mutasi beserta jurnalnya. |
| `POST` | `/api/customer-deposits` | Menerima deposit atau mengembalikannya. |
| `POST` | `/api/customer-deposits/{id}/cancel` | Membatalkan; jurnalnya dibalik dan saldonya kembali. |

Deposit dapat diterima **tanpa invoice lebih dahulu** — itulah sebabnya ia
modul mandiri, bukan bagian dari form penjualan.

### Posisi per customer

```json
{
  "data": [
    {
      "customer": { "id": 4, "code": "CUS-004", "name": "PT Karya Mandiri" },
      "received": "15000000.00",
      "applied": "13500000.00",
      "refunded": "0.00",
      "balance": "1500000.00",
      "last_activity": "2026-09-17"
    }
  ]
}
```

Saldo deposit adalah pertanyaan **per customer** — "si A masih punya titipan
berapa" — bukan per tanggal. Karena itu inilah tampilan utama halaman Deposit,
dan riwayat mutasinya baru dibuka setelah satu customer dipilih.

Keempat angkanya lengkap agar barisnya dapat dijumlah sendiri oleh pembaca:
masuk − terpakai − dikembalikan = saldo. Pengembalian uang kepada customer
adalah kejadian yang berbeda sifatnya dari pemakaian pada invoice, sehingga
tidak dilebur menjadi satu angka.

Seluruhnya dijumlahkan database dalam satu kueri agregasi, bukan satu kueri
per customer. Hanya customer yang pernah punya mutasi yang muncul;
`with_balance=1` mempersempitnya lagi ke yang saldonya masih di atas nol.

Riwayat satu customer diambil lewat `GET /api/customer-deposits?customer_id=4`.
Baris `applied` membawa `invoice` dan `journal_entry` milik invoicenya —
pemakaian deposit memang tidak punya jurnal sendiri, potongannya adalah salah
satu baris debit pada jurnal invoice itu.

```http
POST /api/customer-deposits
{
  "date": "2026-09-18",
  "customer_id": 1,
  "movement": "received",
  "amount": "25000000",
  "cash_account_id": 3,
  "reference": "TRF-DEP-01"
}
```

`movement` bernilai `received` atau `refunded`. Nilai ketiga, `applied`, tidak
dapat diminta lewat endpoint ini: ia lahir sendiri ketika invoice kredit
diposting dan saldo depositnya dipotong.

### Jurnal yang terbentuk

```text
Deposit diterima
    D  Kas / Bank
    K  Pendapatan Diterima Dimuka      ← kewajiban, bukan pendapatan

Deposit dikembalikan
    D  Pendapatan Diterima Dimuka
    K  Kas / Bank

Deposit dipakai pada invoice
    (tidak ada jurnal sendiri — potongannya menjadi salah satu baris
     debit pada jurnal invoicenya)
```

Deposit adalah uang yang belum menjadi hak perusahaan: barangnya belum
diserahkan. Pendapatan baru diakui ketika invoicenya terbit.

### Potongan pada invoice

Ketika invoice diposting dengan `use_deposit: true`, saldo deposit customer
dipotong lebih dahulu — baru sisanya diterima tunai atau menjadi piutang. Peta
jurnalnya ada pada bagian 6.

Nilai yang terpakai paling banyak sebesar sisa yang belum tertutup DP, dan
tidak pernah melebihi saldo yang tersedia. Berlaku untuk kedua metode
pembayaran.

Potongannya **tidak otomatis**: pencatat yang memutuskan lewat `use_deposit`.
Saldo customer ditampilkan di form agar keputusan itu dapat diambil sadar.
Detail invoice memuat `deposit_applications`, yaitu mutasi deposit yang
dipotong olehnya.

### Aturan lain yang dijaga backend

1. Akun kas/bank harus berkategori Kas & Bank.
2. Pengembalian tidak boleh melebihi saldo deposit customer.
3. Mutasi `applied` tidak dapat dibatalkan langsung — batalkan invoicenya,
   dan saldonya kembali dengan sendirinya.
4. Deposit masuk yang saldonya sudah terpakai invoice tidak dapat dibatalkan;
   pemakaiannya harus dilepas lebih dahulu.

`GET /api/customers?with_balance=1` memuat `deposit_balance` dan
`open_receivable` per customer, dihitung lewat subquery agar daftar customer
tidak menjalankan satu kueri agregasi per baris.

---

## 9. Pembelian — **Tersedia**

| Metode | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/purchase-categories` | Kategori pembelian beserta akun yang dipakainya. |
| `GET` | `/api/suppliers` | Master supplier. `with_balance=1` menyertakan utang terbukanya. |
| `GET` | `/api/purchase-bills` | Daftar tagihan, berhalaman. Filter: `from`, `to`, `supplier_id`, `category`, `status`, `outstanding`, `search`. |
| `GET` | `/api/purchase-bills/summary` | Total pembelian, dibayar, utang terbuka, dan jumlah tagihan jatuh tempo. |
| `GET` | `/api/purchase-bills/{id}` | Satu tagihan beserta item dan jurnalnya. |
| `POST` | `/api/purchase-bills` | Membuat tagihan. |
| `POST` | `/api/purchase-bills/{id}/post` | Memposting tagihan yang masih draft. |
| `POST` | `/api/purchase-bills/{id}/cancel` | Membatalkan; jurnalnya dibalik. |
| `DELETE` | `/api/purchase-bills/{id}` | Hanya untuk tagihan yang masih draft. |

### Kategori pembelian

Inilah yang membedakan pembelian dari penjualan. Penjualan selalu bermuara ke
akun pendapatan; pembelian bisa masuk persediaan atau langsung menjadi beban,
dan **kategorilah yang menentukan akunnya** — termasuk akun utang yang dipakai
bila pembeliannya bertermin.

| Kategori | Debit | Utang | Sifat |
|---|---|---|---|
| `bahan_baku_polos` | `1-10201` | `2-10001` Hutang Supplier Karung | persediaan |
| `bahan_baku_kw` | `1-10200` | `2-10001` Hutang Supplier Karung | persediaan |
| `bahan_pendukung` | `1-10204` | `2-10002` Hutang Supplier Bahan Pendukung | persediaan |
| `sparepart` | `1-10205` | `2-10000` Hutang Usaha | persediaan |
| `perlengkapan_produksi` | `5-11010` | `2-10000` | beban |
| `pelumas_mesin` | `5-11004` | `2-10000` | beban |
| `jasa_maintenance` | `5-11006` | `2-10000` | beban |
| `perlengkapan_kantor` | `6-10005` | `2-10000` | beban |
| `lainnya` | dipilih pengguna | `2-10000` | beban |

**Karung bukan kategori tersendiri.** Karung bekas adalah bahan baku utama
pabrik ini, sehingga masuk kategori Bahan Baku — dan karena pemasoknya adalah
pemasok karung, akun utangnya `2-10001 Hutang Supplier Karung`. Karung baru
dipakai sebagai wadah barang jadi, sehingga masuk Bahan Pendukung.

Pemetaannya ada di `config/triplastindo.php`, bukan di kode, agar dapat
dipindahkan ketika COA berkembang — misalnya bila Bahan Pendukung kelak
mendapat akun persediaannya sendiri. Endpoint `/api/purchase-categories`
mengirimkannya ke frontend lengkap dengan nama akunnya, sehingga form dapat
menjelaskan ke mana sebuah kategori bermuara sebelum tagihannya disimpan.

```http
POST /api/purchase-bills
{
  "date": "2026-09-18",
  "supplier_id": 2,
  "supplier_invoice_number": "NOTA-8821",
  "category": "bahan_baku_polos",
  "settlement_method": "payable",
  "term_days": 14,
  "items": [
    { "product_id": 3, "quantity": "10000", "unit_price": "5000" }
  ]
}
```

### Jurnal yang terbentuk

```text
D  Akun kategori          subtotal
D  PPN Masukan            bila ada
K  Kas / Bank             sebesar yang benar-benar dibayar
K  Akun utang kategori    sisanya
```

Satu baris debit untuk seluruh item, karena kategorinya berlaku untuk satu
tagihan — rinciannya sudah tersimpan pada baris itemnya.

### Aturan yang dijaga backend

Seluruhnya dijawab `422`:

1. Sedikitnya satu baris item, dengan kuantitas dan harga di atas nol.
2. **Kategori persediaan menuntut setiap barisnya menunjuk produk**, agar kartu
   stoknya kelak dapat mengikuti. Kategori beban cukup keterangan — jasa dan
   perlengkapan memang tidak ada di master produk.
3. Kategori `lainnya` memerlukan `expense_account_id`.
4. Akun pembayar wajib diisi bila ada uang yang benar-benar keluar, dan harus
   berkategori Kas & Bank.
5. DP tidak melebihi total, dan hanya berlaku pada pembelian bertermin.
6. Pembelian bertermin wajib memiliki tanggal jatuh tempo.

### Belum tersedia pada modul ini

- **Pembayaran kepada supplier.** Utang terbentuk tetapi belum dapat dilunasi —
  cerminan penerimaan pembayaran pada penjualan, dan menyusul berikutnya.
- **Kategori Aset Tetap.** Pembelian aset semestinya juga membentuk kartu aset
  untuk penyusutan; menjurnalnya tanpa kartu berarti aset yang tidak pernah
  disusutkan. Menunggu modul Aset.
- Kartu stok. Item pembelian sudah menunjuk produk, tetapi mutasi persediaannya
  belum dicatat.

---

## 10. Buku Besar dan neraca saldo — *rencana*

| Metode | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/ledger/{account}` | Mutasi satu akun beserta saldo berjalan. |
| `GET` | `/api/trial-balance` | Neraca saldo per akun. |
| `GET` | `/api/trial-balance/categories` | Neraca saldo per kategori. |

```json
{
  "data": {
    "account": { "code": "1-10003", "name": "Bank BCA", "normal_balance": "debit" },
    "opening_balance": "50000000.00",
    "rows": [
      {
        "date": "2026-09-17",
        "number": "JU/2026/09/0001",
        "description": "Penjualan tali tunai",
        "debit": "1500000.00",
        "credit": "0.00",
        "balance": "51500000.00"
      }
    ],
    "total_debit": "1500000.00",
    "total_credit": "0.00",
    "closing_balance": "51500000.00"
  }
}
```

Saldo berjalan mengikuti saldo normal akun: akun Debit dihitung `debit − kredit`,
akun Kredit dihitung `kredit − debit`. Perhitungannya ada di backend supaya
seluruh laporan memakai angka yang sama.

---

## 11. Periode buku — *rencana*

| Metode | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/fiscal-periods` | Status tiap bulan. |
| `POST` | `/api/fiscal-periods/close` | Menutup satu bulan. Super Admin. |
| `POST` | `/api/fiscal-periods/reopen` | Membuka kembali. Super Admin. |

Bulan yang belum pernah ditutup dianggap terbuka dan tidak memiliki baris di
database. Aplikasi hanya mencatat bulan yang pernah ditutup, sehingga tidak
perlu menyemai seluruh bulan di muka hanya agar jurnal dapat masuk.

---

## 12. Kontrak internal: cara modul memposting jurnal

Modul transaksi tidak menulis ke tabel jurnal secara langsung dan tidak
memanggil endpoint di atas. Semuanya menyusun `JournalDraft` lalu menyerahkannya
ke `JournalPoster`:

```php
$entry = (new JournalPoster)->post(new JournalDraft(
    date: $invoice->date,
    description: "Penjualan {$invoice->number} — {$invoice->customer->name}",
    lines: [
        JournalLineDraft::debit('1-10100', $invoice->total),   // Piutang Usaha
        JournalLineDraft::credit('4-10000', $invoice->subtotal), // Penjualan Tali
        JournalLineDraft::credit('2-10100', $invoice->tax),    // PPN Keluaran
    ],
    createdBy: $request->user()->id,
    source: JournalSource::Sale,
    sourceId: $invoice->id,
));
```

`JournalPoster` adalah satu-satunya pintu masuk jurnal ke database. Kelima
aturan pada bagian 4 diperiksa di sana, sekali, untuk seluruh modul — sehingga
tidak ada modul yang dapat melewatinya, dan tidak ada aturan yang perlu ditulis
dua kali.

Berkasnya:

```
app/Services/Accounting/JournalDraft.php      bentuk transaksi yang diajukan
app/Services/Accounting/JournalLineDraft.php  satu baris debit atau kredit
app/Services/Accounting/JournalPoster.php     pemeriksa aturan dan penyimpan
app/Services/DocumentNumberGenerator.php      nomor PREFIX/YYYY/MM/NNNN
app/Exceptions/JournalPostingException.php    alasan penolakan
```

---

## 13. Modul transaksi berikutnya — *belum dirancang*

Pengeluaran, Kas & Bank, Utang, Piutang, Aset,
Payroll, Bagi Hasil, dan Inventory menyusul dengan pola yang sama seperti
Penjualan pada bagian 6: satu endpoint CRUD untuk dokumennya, satu service
yang menerjemahkannya menjadi `JournalDraft`, dan posting yang tetap melewati
`JournalPoster`. Peta jurnal tiap dokumen ada pada
`triplastindo-finance-webapp.md` bagian 5.

Berkas yang dapat dijadikan contoh:

```
app/Services/Sales/SalesInvoiceData.php      isi dokumen yang diajukan
app/Services/Sales/SalesInvoiceItemData.php  satu baris produk
app/Services/Sales/SalesInvoicePoster.php    aturan penjualan dan jurnalnya
app/Http/Controllers/Sales/SalesInvoiceController.php
app/Http/Requests/Sales/StoreSalesInvoiceRequest.php

app/Services/Receivables/PaymentReceiptPoster.php  contoh kedua: pelunasan
app/Services/Deposits/CustomerDepositPoster.php   contoh ketiga: uang muka
app/Services/Purchases/PurchaseBillPoster.php     contoh keempat: kategori
```

Pembagian tugasnya: FormRequest memeriksa **bentuk** permintaan, service
memeriksa **aturan** dokumennya, dan `JournalPoster` memeriksa **aturan
akuntansinya** — sehingga aturan dokumen tetap berlaku bagi pemanggil yang
bukan HTTP, seperti impor data dan perintah artisan.
