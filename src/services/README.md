# services

Lapisan akses data. Komponen tidak memanggil `fetch` secara langsung, melainkan
melalui service di folder ini.

```
services/
├── httpClient.ts         # fetch + token Bearer + ApiError
├── tokenStorage.ts
├── authService.ts        # login, me, logout
├── masterDataService.ts  # accounts, customers, products
└── salesService.ts       # invoice penjualan
```

Service mengembalikan tipe `Api*` dari `src/types/api.ts`, yang menggambarkan
kontrak backend apa adanya termasuk penamaan snake_case-nya. Tipe tampilan di
berkas `src/types` lainnya dipakai oleh modul yang masih membaca `src/mocks`.

Nilai uang datang sebagai **string** dua desimal — `"105000000.00"`. Biarkan
apa adanya selama disimpan dan dikirim kembali; ubah dengan `toAmount()` dari
`@/lib` hanya tepat sebelum diformat untuk ditampilkan.

Modul yang belum punya service masih membaca `src/mocks`. Menambah service baru
berarti satu berkas di sini, lalu halamannya beralih dari mock ke service itu —
seperti yang sudah dilakukan halaman Penjualan.
