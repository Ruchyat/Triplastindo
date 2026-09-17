<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TokenAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_endpoint_me_mengembalikan_user_yang_sedang_masuk(): void
    {
        $user = User::factory()->role(UserRole::SuperAdmin)->create([
            'name' => 'Super Admin',
            'email' => 'admin@triplastindo.com',
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'admin@triplastindo.com')
            ->assertJsonPath('data.role', 'super_admin')
            ->assertJsonPath('data.is_active', true);
    }

    public function test_endpoint_terlindungi_menolak_permintaan_tanpa_token(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_endpoint_terlindungi_menolak_token_yang_tidak_valid(): void
    {
        $this->withToken('token-palsu')
            ->getJson('/api/me')
            ->assertStatus(401);
    }

    public function test_logout_mencabut_token_yang_sedang_dipakai(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Berhasil keluar.');

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Guard menyimpan user yang sudah diautentikasi pada request sebelumnya
        // di dalam satu test, jadi perlu dilupakan agar token benar-benar diuji ulang.
        $this->app['auth']->forgetGuards();

        // Token yang sudah dicabut tidak bisa dipakai lagi.
        $this->withToken($token)->getJson('/api/me')->assertStatus(401);
    }

    public function test_logout_all_mencabut_seluruh_token_user(): void
    {
        $user = User::factory()->create();
        $first = $user->createToken('laptop')->plainTextToken;
        $user->createToken('ponsel');

        $this->assertDatabaseCount('personal_access_tokens', 2);

        $this->withToken($first)->postJson('/api/logout-all')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_token_user_lain_tidak_dapat_mengakses_data_user_ini(): void
    {
        $admin = User::factory()->role(UserRole::SuperAdmin)->create([
            'email' => 'admin@triplastindo.com',
        ]);
        $viewer = User::factory()->role(UserRole::Viewer)->create([
            'email' => 'viewer@triplastindo.com',
        ]);

        $this->withToken($viewer->createToken('test')->plainTextToken)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.email', $viewer->email)
            ->assertJsonMissing(['email' => $admin->email]);
    }
}
