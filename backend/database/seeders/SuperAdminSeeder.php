<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Membuat akun Super Admin pertama.
 *
 * Kredensialnya dibaca dari `.env`, sehingga kata sandi produksi tidak ikut
 * tersimpan di dalam kode. Seeder memakai updateOrCreate agar aman dijalankan
 * berulang kali tanpa menggandakan akun.
 */
class SuperAdminSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $email = config('triplastindo.super_admin.email');
        $password = config('triplastindo.super_admin.password');

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => config('triplastindo.super_admin.name'),
                'password' => Hash::make($password),
                'role' => UserRole::SuperAdmin,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        $this->command?->info("Super Admin siap: {$user->email}");

        if ($password === 'password') {
            $this->command?->warn(
                'Kata sandi masih memakai nilai bawaan. Ubah SUPER_ADMIN_PASSWORD di .env sebelum dipakai di luar mesin lokal.',
            );
        }
    }
}
