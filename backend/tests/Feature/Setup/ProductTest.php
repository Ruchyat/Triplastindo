<?php

namespace Tests\Feature\Setup;

use App\Models\Product;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\MasterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Produk dapat ditambah langsung dari form pembelian, jadi endpointnya harus
 * cukup dengan nama, kategori, dan satuan — kodenya dibuatkan.
 */
class ProductTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ChartOfAccountSeeder::class);
        $this->seed(MasterDataSeeder::class);

        Sanctum::actingAs(User::factory()->create());
    }

    public function test_produk_baru_mendapat_kode_otomatis_berurutan(): void
    {
        $first = $this->postJson('/api/products', [
            'name' => 'Bahan Baku Warna',
            'category' => 'bahan_baku',
            'unit' => 'Kg',
        ])->assertCreated()->json('data');

        $second = $this->postJson('/api/products', [
            'name' => 'Karung Bergaris',
            'category' => 'bahan_pendukung',
            'unit' => 'Lembar',
        ])->assertCreated()->json('data');

        $this->assertSame('PRD-0001', $first['code']);
        $this->assertSame('PRD-0002', $second['code']);
        $this->assertSame('Bahan Baku', $first['category_label']);
        $this->assertSame('Lembar', $second['unit']);
        $this->assertTrue($second['is_active']);
    }

    public function test_kode_yang_diisi_sendiri_dipakai_apa_adanya(): void
    {
        $this->postJson('/api/products', [
            'code' => 'PRD-BBW',
            'name' => 'Bahan Baku Warna',
            'category' => 'bahan_baku',
            'unit' => 'Kg',
        ])->assertCreated()->assertJsonPath('data.code', 'PRD-BBW');
    }

    public function test_nama_dan_kode_tidak_boleh_kembar(): void
    {
        $this->postJson('/api/products', [
            'name' => 'Tali',
            'category' => 'tali',
            'unit' => 'Kg',
        ])->assertStatus(422)->assertJsonValidationErrors('name');

        $this->postJson('/api/products', [
            'code' => 'PRD-TAL',
            'name' => 'Tali Baru',
            'category' => 'tali',
            'unit' => 'Kg',
        ])->assertStatus(422)->assertJsonValidationErrors('code');
    }

    public function test_kategori_harus_dari_daftar(): void
    {
        $this->postJson('/api/products', [
            'name' => 'Produk Aneh',
            'category' => 'tidak_ada',
            'unit' => 'Kg',
        ])->assertStatus(422)->assertJsonValidationErrors('category');

        $this->assertSame(
            Product::query()->count(),
            7,
            'Produk yang ditolak tidak boleh tersimpan.',
        );
    }

    public function test_daftar_kategori_produk_tersedia_untuk_dropdown(): void
    {
        $this->getJson('/api/product-categories')
            ->assertOk()
            ->assertJsonFragment(['value' => 'bahan_baku', 'label' => 'Bahan Baku']);
    }
}
