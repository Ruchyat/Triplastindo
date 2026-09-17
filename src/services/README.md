# services

Lapisan akses data. Komponen tidak memanggil `fetch` secara langsung, melainkan
melalui service di folder ini.

Selama tahap UI, halaman masih membaca data dari `src/mocks`. Ketika REST API
Laravel tersedia, tiap modul mendapat satu berkas service, misalnya:

```
services/
├── httpClient.ts       # sudah tersedia
├── salesService.ts     # getInvoices(), createInvoice(), ...
├── purchaseService.ts
├── journalService.ts
└── reportService.ts
```

Bentuk data yang dikembalikan service mengikuti tipe di `src/types`, sehingga
penggantian mock menjadi API tidak mengubah komponen.
