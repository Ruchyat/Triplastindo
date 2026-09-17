<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Akun Super Admin
    |--------------------------------------------------------------------------
    |
    | Dipakai oleh SuperAdminSeeder untuk membuat akun pertama. Ubah nilainya
    | lewat .env, jangan di berkas ini, agar kredensial tidak ikut ter-commit.
    |
    */

    'super_admin' => [
        'name' => env('SUPER_ADMIN_NAME', 'Super Admin'),
        'email' => env('SUPER_ADMIN_EMAIL', 'admin@triplastindo.com'),
        'password' => env('SUPER_ADMIN_PASSWORD', 'password'),
    ],

];
