# Triplastindo Finance — Lingkungan Pengembangan

> Catatan cara kerja lingkungan pengembangan di mesin lokal.
> Disusun 17 September 2026.

---

## 1. Ringkasan

Seluruh layanan berjalan **permanen** dan menyala sendiri. Tidak perlu menjalankan
`npm run dev` atau `php artisan serve`.

| Layanan | Cara jalan | Alamat |
|---|---|---|
| Backend Laravel | Laravel Valet | `http://be-triplastindo.test` |
| Frontend Vite | LaunchAgent `com.triplastindo.vite` | port `5178` |
| Cloudflare Tunnel | LaunchAgent `com.triplastindo.cloudflared` | `https://dev.tplastindo.com` |
| MySQL | Homebrew service | `127.0.0.1:3306` |

Aplikasi dapat dibuka dari tiga arah, dan ketiganya berfungsi tanpa penyesuaian:

```text
http://localhost:5178          dari mesin ini
http://192.168.8.9:5178        dari perangkat lain di jaringan yang sama
https://dev.tplastindo.com     dari internet
```

---

## 2. Mengapa satu hostname cukup

Frontend memanggil `/api` pada origin yang sama, lalu dev server Vite meneruskannya
ke Valet:

```text
Browser  ──►  Vite :5178  ──►  be-triplastindo.test  ──►  Laravel
             (server.proxy)         (Valet)
```

Karena alamat API bersifat relatif, aplikasi selalu menemukan backend dari mana pun
dibuka. Konsekuensi lainnya: **CORS tidak ikut bermain selama pengembangan**, sebab
dari sudut pandang browser semuanya satu origin.

Ini juga alasan tidak ada hostname terpisah untuk backend, berbeda dari proyek lain
yang memakai pola `be.*` dan `fe.*`.

---

## 3. Port 5178

Port ini khusus proyek ini, bukan 5173 yang dipakai proyek lain, agar domain tunnel
selalu menunjuk ke aplikasi yang benar.

`vite.config.ts` memakai `strictPort: true`. Vite akan **gagal terang-terangan** bila
port terpakai, bukan diam-diam pindah ke 5174 — sebab kepindahan port membuat tunnel
menunjuk ke tempat yang salah.

Kalau `npm run dev` gagal dengan "Port 5178 is already in use", itu berarti
LaunchAgent-nya memang sedang berjalan. Itu kondisi normal.

---

## 4. Dua tunnel, dua akun Cloudflare

Proyek ini memakai tunnel sendiri bernama `triplastindo`, terpisah dari `rmw-tunnel`
yang melayani proyek lain.

Alasannya: **Cloudflare hanya memetakan hostname ke tunnel bila zona dan tunnel berada
dalam satu akun.** Zona `tplastindo.com` berada di akun berbeda dari tunnel lama,
sehingga `dev.tplastindo.com` yang diarahkan ke `rmw-tunnel` selalu menghasilkan
error 1033 walaupun DNS dan tunnelnya sendiri sehat.

| Berkas | Isi |
|---|---|
| `~/.cloudflared/tplastindo.yml` | Config tunnel proyek ini |
| `~/.cloudflared/config.yml` | Config `rmw-tunnel`, proyek lain |
| `~/.cloudflared/cert.pem` | Kredensial CLI, aktif untuk zona `rmw78.cfd` |
| `~/.cloudflared/cert.pem.tplastindo` | Kredensial CLI untuk zona `tplastindo.com` |

Menambah hostname pada `tplastindo.com` tanpa perlu login ulang:

```bash
cloudflared --origincert ~/.cloudflared/cert.pem.tplastindo \
  tunnel route dns triplastindo api.tplastindo.com
```

Kedua config memakai `protocol: http2` karena QUIC tidak tembus di jaringan ini.

---

## 5. Perintah yang berguna

```bash
# Log
tail -f ~/Library/Logs/triplastindo-vite.log
tail -f ~/Library/Logs/triplastindo-cloudflared.log

# Restart satu layanan
launchctl kickstart -k gui/$(id -u)/com.triplastindo.vite
launchctl kickstart -k gui/$(id -u)/com.triplastindo.cloudflared

# Matikan sementara, lalu nyalakan lagi
launchctl unload ~/Library/LaunchAgents/com.triplastindo.vite.plist
launchctl load   ~/Library/LaunchAgents/com.triplastindo.vite.plist

# Memastikan layanan hidup
curl http://be-triplastindo.test/up
curl -o /dev/null -w '%{http_code}\n' https://dev.tplastindo.com/
```

Perintah artisan non-server tetap dijalankan seperti biasa dari folder `backend/`:

```bash
php artisan migrate
php artisan db:seed --class=SuperAdminSeeder
php artisan test
./vendor/bin/pint
```

---

## 6. Berkas konfigurasi

| Berkas | Isi penting |
|---|---|
| `.env` (root) | `VITE_API_PROXY_TARGET`, `VITE_ALLOWED_HOSTS` |
| `vite.config.ts` | Port 5178, `host: true`, `allowedHosts`, proxy `/api` |
| `backend/.env` | `DB_*`, `APP_URL`, `FRONTEND_URL`, `SUPER_ADMIN_*` |
| `backend/config/cors.php` | Origin tetap plus pola IP privat khusus `APP_ENV=local` |

`VITE_ALLOWED_HOSTS` wajib memuat domain tunnel. Tanpa itu Vite menolak permintaan
dengan pesan "Blocked request. This host is not allowed" — perlindungan terhadap
DNS rebinding.

---

## 7. Akun masuk

```text
admin@triplastindo.com
password
```

Dibuat oleh `SuperAdminSeeder`, kredensialnya dibaca dari `backend/.env`. Kata sandi
bawaan hanya untuk mesin lokal dan harus diganti sebelum dipakai di tempat lain.
