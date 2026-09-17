<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Pembatas login dibagi antar-test, jadi dibersihkan sebelum tiap kasus.
        RateLimiter::clear('login:admin@triplastindo.com|127.0.0.1');
    }

    public function test_super_admin_dapat_login_dan_menerima_token(): void
    {
        $user = User::factory()->role(UserRole::SuperAdmin)->create([
            'email' => 'admin@triplastindo.com',
            'password' => Hash::make('rahasia123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@triplastindo.com',
            'password' => 'rahasia123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role', 'role_label']])
            ->assertJsonPath('user.role', 'super_admin')
            ->assertJsonPath('user.role_label', 'Super Admin');

        $this->assertNotEmpty($response->json('token'));
        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_respons_login_tidak_pernah_memuat_password(): void
    {
        User::factory()->create([
            'email' => 'admin@triplastindo.com',
            'password' => Hash::make('rahasia123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@triplastindo.com',
            'password' => 'rahasia123',
        ]);

        $response->assertOk();
        $this->assertArrayNotHasKey('password', $response->json('user'));
    }

    public function test_login_ditolak_ketika_kata_sandi_salah(): void
    {
        User::factory()->create([
            'email' => 'admin@triplastindo.com',
            'password' => Hash::make('rahasia123'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'admin@triplastindo.com',
            'password' => 'salah',
        ])->assertStatus(422)->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_ditolak_ketika_email_tidak_terdaftar(): void
    {
        $this->postJson('/api/login', [
            'email' => 'bukan@triplastindo.com',
            'password' => 'rahasia123',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_user_nonaktif_tidak_dapat_login(): void
    {
        User::factory()->inactive()->create([
            'email' => 'admin@triplastindo.com',
            'password' => Hash::make('rahasia123'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'admin@triplastindo.com',
            'password' => 'rahasia123',
        ])->assertStatus(422)->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_email_dan_kata_sandi_wajib_diisi(): void
    {
        $this->postJson('/api/login', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_dibatasi_setelah_lima_percobaan_gagal(): void
    {
        User::factory()->create([
            'email' => 'admin@triplastindo.com',
            'password' => Hash::make('rahasia123'),
        ]);

        foreach (range(1, 5) as $ignored) {
            $this->postJson('/api/login', [
                'email' => 'admin@triplastindo.com',
                'password' => 'salah',
            ])->assertStatus(422);
        }

        // Percobaan keenam ditolak walau kata sandinya benar.
        $response = $this->postJson('/api/login', [
            'email' => 'admin@triplastindo.com',
            'password' => 'rahasia123',
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString(
            'Terlalu banyak percobaan login',
            $response->json('errors.email.0'),
        );
    }
}
