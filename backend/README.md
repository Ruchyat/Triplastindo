# Triplastindo Finance — Backend API

REST API Laravel untuk aplikasi finance internal Triplastindo.

**Status:** tahap autentikasi. Modul transaksi, jurnal, dan laporan menyusul.

- Laravel 13 · PHP 8.5 · MySQL
- Autentikasi: Laravel Sanctum, token Bearer

---

## Menjalankan di mesin lokal

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Buat database, lalu sesuaikan `DB_*` di `.env`:

```bash
mysql -u root -e "CREATE DATABASE triplastindo_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Jalankan migrasi beserta akun Super Admin:

```bash
php artisan migrate --seed
```

Aplikasi disajikan oleh **Laravel Valet** pada `http://be-triplastindo.test`.
Jangan menjalankan `php artisan serve` — Valet sudah melayani domain tersebut.

```bash
curl http://be-triplastindo.test/up     # memastikan backend hidup
```

---

## Akun Super Admin

Dibuat oleh `SuperAdminSeeder`, kredensialnya dibaca dari `.env`:

```env
SUPER_ADMIN_NAME="Super Admin"
SUPER_ADMIN_EMAIL=admin@triplastindo.com
SUPER_ADMIN_PASSWORD=password
```

Seeder memakai `updateOrCreate`, jadi aman dijalankan berulang kali. Untuk
menerapkan kata sandi baru, ubah `.env` lalu jalankan:

```bash
php artisan db:seed --class=SuperAdminSeeder
```

> **Ganti `SUPER_ADMIN_PASSWORD` sebelum dipakai di luar mesin lokal.**
> Nilai bawaan `password` hanya untuk pengembangan, dan seeder akan
> memperingatkan selama nilai itu masih dipakai.

---

## Endpoint

| Metode | Endpoint          | Auth  | Keterangan                          |
| ------ | ----------------- | ----- | ----------------------------------- |
| POST   | `/api/login`      | –     | Menukar kredensial dengan token     |
| GET    | `/api/me`         | Token | Data user yang sedang masuk         |
| POST   | `/api/logout`     | Token | Mencabut token yang sedang dipakai  |
| POST   | `/api/logout-all` | Token | Mencabut seluruh token milik user   |

### Login

```http
POST /api/login
Content-Type: application/json
Accept: application/json

{ "email": "admin@triplastindo.com", "password": "password", "device_name": "web" }
```

```json
{
  "token": "1|BEouj6Q7XTm5TUTaLLCWicrjmqgNMc2i...",
  "user": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@triplastindo.com",
    "role": "super_admin",
    "role_label": "Super Admin",
    "is_active": true,
    "last_login_at": "2026-09-17T11:34:41+00:00"
  }
}
```

`device_name` bersifat opsional (default `web`) dan menjadi label token,
sehingga satu user bisa masuk dari beberapa perangkat dan mencabutnya satu per satu.

### Memakai token

```http
GET /api/me
Authorization: Bearer 1|BEouj6Q7XTm5TUTaLLCWicrjmqgNMc2i...
Accept: application/json
```

Selalu kirim `Accept: application/json` agar kegagalan autentikasi dijawab
`401` dalam bentuk JSON, bukan halaman redirect.

### Bentuk kegagalan

| Kondisi                         | Status | Isi                                                   |
| ------------------------------- | ------ | ----------------------------------------------------- |
| Kredensial salah                | 422    | `errors.email[0]` = "Email atau kata sandi salah."     |
| Akun dinonaktifkan              | 422    | `errors.email[0]` = "Akun ini tidak aktif…"            |
| Lebih dari 5 percobaan gagal    | 422    | `errors.email[0]` = "Terlalu banyak percobaan login…"  |
| Token tidak ada / sudah dicabut | 401    | `message` = "Unauthenticated."                        |

Pesan kredensial salah sengaja dibuat sama untuk email yang tidak terdaftar
maupun kata sandi keliru, agar tidak membocorkan email mana yang ada di sistem.

---

## Peran pengguna

`App\Enums\UserRole` — disimpan pada kolom `users.role`:

| Nilai         | Label                   |
| ------------- | ----------------------- |
| `super_admin` | Super Admin             |
| `finance`     | Finance / Akuntan       |
| `hr`          | HR / Payroll            |
| `direksi`     | Direksi / Owner         |
| `viewer`      | Viewer / Pemegang Saham |

Pengecekan di kode:

```php
$user->isSuperAdmin();
$user->hasRole(UserRole::Finance, UserRole::SuperAdmin);
```

Matriks izin per modul belum dibuat — menyusul ketika modulnya dikerjakan.

---

## CORS

`config/cors.php` hanya mengizinkan origin pada `FRONTEND_URL` (default
`http://localhost:5173`). Untuk beberapa origin, pisahkan dengan koma:

```env
FRONTEND_URL=http://localhost:5173,https://finance.triplastindo.com
```

---

## Pengujian

```bash
php artisan test            # memakai SQLite in-memory
./vendor/bin/pint           # format kode
```

---

## Hubungan dengan frontend

Frontend memanggil `/api` pada origin yang sama; dev server Vite meneruskannya
ke `VITE_API_PROXY_TARGET` (lihat `.env` di root repo, bawaannya
`http://be-triplastindo.test`). Karena satu origin, CORS tidak ikut bermain
selama pengembangan.
