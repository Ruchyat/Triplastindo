<?php

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS)
|--------------------------------------------------------------------------
|
| Menentukan asal (origin) mana yang boleh memanggil API ini dari browser.
|
*/

$isLocal = env('APP_ENV', 'production') === 'local';

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    /*
    | Daftar origin tetap. Tambahkan URL staging atau produksi lewat
    | FRONTEND_URL di .env, dipisahkan koma.
    */
    'allowed_origins' => array_map(
        'trim',
        explode(',', (string) env('FRONTEND_URL', 'http://localhost:5173')),
    ),

    /*
    | Selama pengembangan, izinkan juga akses dari perangkat lain pada jaringan
    | lokal — IP-nya berubah-ubah sehingga tidak praktis didaftarkan satu per satu.
    | Pola ini hanya aktif saat APP_ENV=local dan tidak pernah berlaku di produksi.
    */
    'allowed_origins_patterns' => $isLocal
        ? ['#^https?://(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?$#']
        : [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
