<?php

namespace Tests\Feature\Setup;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\AccountCategory;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\MasterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Master data dapat dibuat dan disunting; yang sudah dipakai dokumen tidak dihapus, hanya dinonaktifkan. */
class MasterDataTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ChartOfAccountSeeder::class);
        $this->seed(MasterDataSeeder::class);

        Sanctum::actingAs(User::factory()->role(UserRole::Finance)->create());
    }

    public function test_customer_baru_mendapat_kode_berurutan_dan_dapat_disunting(): void
    {
        $customer = $this->postJson('/api/customers', [
            'name' => 'PT Plastik Nusantara',
            'payment_term_days' => 21,
        ])->assertCreated()->json('data');

        // Seeder sudah sampai CUS-004, tiga digit.
        $this->assertSame('CUS-005', $customer['code']);
        $this->assertTrue($customer['is_active']);

        $this->putJson("/api/customers/{$customer['id']}", [
            'name' => 'PT Plastik Nusantara Jaya',
            'payment_term_days' => 30,
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.name', 'PT Plastik Nusantara Jaya')
            ->assertJsonPath('data.code', 'CUS-005')
            ->assertJsonPath('data.is_active', false);

        $this->assertFalse(Customer::query()->findOrFail($customer['id'])->is_active);
    }

    public function test_nama_customer_tidak_boleh_kembar(): void
    {
        $this->postJson('/api/customers', ['name' => 'PT Tali Nusantara', 'payment_term_days' => 30])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_supplier_dapat_dibuat_dengan_kode_sendiri(): void
    {
        $this->postJson('/api/suppliers', [
            'code' => 'SUP-PLN',
            'name' => 'PLN',
            'payment_term_days' => 0,
        ])->assertCreated()->assertJsonPath('data.code', 'SUP-PLN');
    }

    public function test_produk_dapat_disunting_dan_dinonaktifkan(): void
    {
        $product = Product::query()->where('code', 'PRD-KRG')->firstOrFail();

        $this->putJson("/api/products/{$product->id}", [
            'name' => 'Karung Polos 50 Kg',
            'category' => 'bahan_pendukung',
            'unit' => 'Lembar',
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.unit', 'Lembar')
            ->assertJsonPath('data.is_active', false);

        $this->assertNotContains(
            'PRD-KRG',
            collect($this->getJson('/api/products?is_active=1')->json('data'))->pluck('code'),
        );
    }

    public function test_akun_baru_mengikuti_kategori_dan_kode_berpola(): void
    {
        $category = AccountCategory::query()->where('name', 'Kas & Bank')->firstOrFail();

        $account = $this->postJson('/api/accounts', [
            'code' => '1-10009',
            'name' => 'Bank Mandiri',
            'account_category_id' => $category->id,
            'normal_balance' => 'debit',
        ])->assertCreated()->json('data');

        $this->assertTrue($account['is_cash']);

        $this->postJson('/api/accounts', [
            'code' => 'BANK-1',
            'name' => 'Salah pola',
            'account_category_id' => $category->id,
            'normal_balance' => 'debit',
        ])->assertStatus(422)->assertJsonValidationErrors('code');
    }

    public function test_akun_yang_sudah_dipakai_jurnal_tidak_boleh_ganti_kode(): void
    {
        $bank = Account::query()->where('code', '1-10003')->firstOrFail();

        $this->postJson('/api/journal-entries', [
            'date' => '2026-09-10',
            'description' => 'Admin bank',
            'lines' => [
                ['account_code' => '6-10012', 'debit' => '15000'],
                ['account_code' => '1-10003', 'credit' => '15000'],
            ],
        ])->assertCreated();

        $payload = [
            'code' => '1-10099',
            'name' => 'Bank BCA Operasional',
            'account_category_id' => $bank->account_category_id,
            'normal_balance' => 'debit',
        ];

        $this->putJson("/api/accounts/{$bank->id}", $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('code');

        // Nama dan status masih boleh diubah.
        $this->putJson("/api/accounts/{$bank->id}", [...$payload, 'code' => '1-10003', 'is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.name', 'Bank BCA Operasional')
            ->assertJsonPath('data.is_active', false);
    }
}
