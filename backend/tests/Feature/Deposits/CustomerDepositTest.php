<?php

namespace Tests\Feature\Deposits;

use App\Enums\DocumentStatus;
use App\Models\Account;
use App\Models\Customer;
use App\Models\CustomerDeposit;
use App\Models\Product;
use App\Models\SalesInvoice;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\MasterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Menguji aturan pusat modul deposit: satu customer tidak boleh menyimpan
 * saldo deposit dan piutang terbuka secara bersamaan, karena depositnya
 * dipotong lebih dahulu saat invoice kredit diposting.
 */
class CustomerDepositTest extends TestCase
{
    use RefreshDatabase;

    private Account $bank;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ChartOfAccountSeeder::class);
        $this->seed(MasterDataSeeder::class);

        $this->bank = Account::query()->where('code', '1-10003')->firstOrFail();
        $this->customer = Customer::query()->where('code', 'CUS-001')->firstOrFail();

        Sanctum::actingAs(User::factory()->create());
    }

    public function test_deposit_masuk_dicatat_sebagai_kewajiban(): void
    {
        $deposit = $this->receiveDeposit('25000000');

        $this->assertSame('DEP/2026/09/0001', $deposit['number']);

        // D Bank BCA · K Pendapatan Diterima Dimuka — kewajiban, bukan pendapatan.
        $lines = collect($deposit['journal_entry']['lines']);
        $this->assertSame('25000000.00', $lines->firstWhere('account.code', '1-10003')['debit']);
        $this->assertSame('25000000.00', $lines->firstWhere('account.code', '2-10007')['credit']);

        $this->assertSame('25000000.00', CustomerDeposit::balanceOf($this->customer->id));
    }

    public function test_invoice_kredit_memotong_deposit_sebelum_membentuk_piutang(): void
    {
        $this->receiveDeposit('25000000');

        // Invoice 105 juta: 25 juta ditutup deposit, 80 juta menjadi piutang.
        $invoice = $this->creditInvoice();

        $lines = collect($invoice['journal_entry']['lines']);
        $this->assertSame('25000000.00', $lines->firstWhere('account.code', '2-10007')['debit']);
        $this->assertSame('80000000.00', $lines->firstWhere('account.code', '1-10100')['debit']);
        $this->assertSame('105000000.00', $lines->firstWhere('account.code', '4-10000')['credit']);

        $this->assertSame('80000000.00', $invoice['outstanding_amount']);
        $this->assertSame(DocumentStatus::Partial->value, $invoice['status']);

        // Saldo depositnya habis terpakai, sehingga customer hanya menyisakan
        // piutang — tidak keduanya sekaligus.
        $this->assertSame('0.00', CustomerDeposit::balanceOf($this->customer->id));
    }

    public function test_deposit_lebih_besar_dari_invoice_melunasinya_dan_menyisakan_saldo(): void
    {
        $this->receiveDeposit('150000000');

        $invoice = $this->creditInvoice();

        $this->assertSame('0.00', $invoice['outstanding_amount']);
        $this->assertSame(DocumentStatus::Paid->value, $invoice['status']);
        $this->assertSame('45000000.00', CustomerDeposit::balanceOf($this->customer->id));
    }

    public function test_pembatalan_invoice_mengembalikan_deposit_yang_terpakai(): void
    {
        $this->receiveDeposit('25000000');
        $invoice = $this->creditInvoice();
        $this->assertSame('0.00', CustomerDeposit::balanceOf($this->customer->id));

        $this->postJson("/api/sales-invoices/{$invoice['id']}/cancel")->assertOk();

        $this->assertSame('25000000.00', CustomerDeposit::balanceOf($this->customer->id));
        $this->assertSame(DocumentStatus::Cancelled, SalesInvoice::query()->find($invoice['id'])->status);
    }

    public function test_invoice_tunai_memotong_deposit_dan_menerima_sisanya(): void
    {
        $this->receiveDeposit('25000000');

        // Total 105 juta: 25 juta ditutup deposit, 80 juta masuk ke bank.
        $invoice = $this->cashInvoice();

        $lines = collect($invoice['journal_entry']['lines']);
        $this->assertSame('80000000.00', $lines->firstWhere('account.code', '1-10003')['debit']);
        $this->assertSame('25000000.00', $lines->firstWhere('account.code', '2-10007')['debit']);
        $this->assertSame('105000000.00', $lines->firstWhere('account.code', '4-10000')['credit']);

        $this->assertSame(DocumentStatus::Paid->value, $invoice['status']);
        $this->assertSame('0.00', CustomerDeposit::balanceOf($this->customer->id));
    }

    public function test_invoice_tunai_yang_tertutup_penuh_deposit_tidak_memindahkan_uang(): void
    {
        $this->receiveDeposit('150000000');

        // Tidak ada uang masuk sama sekali, jadi akun kas pun tidak diperlukan.
        $invoice = $this->cashInvoice(withCashAccount: false);

        $lines = collect($invoice['journal_entry']['lines']);
        $this->assertCount(2, $lines);
        $this->assertNull($lines->firstWhere('account.code', '1-10003'));
        $this->assertSame('105000000.00', $lines->firstWhere('account.code', '2-10007')['debit']);

        $this->assertSame(DocumentStatus::Paid->value, $invoice['status']);
        $this->assertSame('45000000.00', CustomerDeposit::balanceOf($this->customer->id));
    }

    public function test_deposit_tidak_dipotong_bila_pencatat_tidak_memilihnya(): void
    {
        $this->receiveDeposit('25000000');

        $invoice = $this->creditInvoice(useDeposit: false);

        // Seluruh nilainya menjadi piutang, dan saldo depositnya tetap utuh.
        $lines = collect($invoice['journal_entry']['lines']);
        $this->assertNull($lines->firstWhere('account.code', '2-10007'));
        $this->assertSame('105000000.00', $lines->firstWhere('account.code', '1-10100')['debit']);
        $this->assertSame('25000000.00', CustomerDeposit::balanceOf($this->customer->id));
    }

    public function test_invoice_tunai_tanpa_akun_kas_ditolak_bila_deposit_tidak_menutupinya(): void
    {
        $this->receiveDeposit('25000000');

        $this->postJson('/api/sales-invoices', [
            'date' => '2026-09-17',
            'customer_id' => $this->customer->id,
            'settlement_method' => 'cash',
            'use_deposit' => true,
            'items' => [$this->item()],
        ])->assertStatus(422);
    }

    public function test_pengembalian_melebihi_saldo_ditolak(): void
    {
        $this->receiveDeposit('25000000');

        $this->postJson('/api/customer-deposits', [
            'date' => '2026-09-16',
            'customer_id' => $this->customer->id,
            'movement' => 'refunded',
            'amount' => '30000000',
            'cash_account_id' => $this->bank->id,
        ])->assertStatus(422);

        $this->assertSame('25000000.00', CustomerDeposit::balanceOf($this->customer->id));
    }

    public function test_deposit_yang_sudah_terpakai_tidak_dapat_dibatalkan(): void
    {
        $deposit = $this->receiveDeposit('25000000');
        $this->creditInvoice();

        $this->postJson("/api/customer-deposits/{$deposit['id']}/cancel")
            ->assertStatus(422)
            ->assertJsonPath('message', fn (string $m) => str_contains($m, 'sudah terpakai pada invoice'));
    }

    /** @return array<string, mixed> */
    private function receiveDeposit(string $amount): array
    {
        return $this->postJson('/api/customer-deposits', [
            'date' => '2026-09-15',
            'customer_id' => $this->customer->id,
            'movement' => 'received',
            'amount' => $amount,
            'cash_account_id' => $this->bank->id,
        ])->assertCreated()->json('data');
    }

    /**
     * Invoice kredit 105 juta tanpa DP, memakai saldo deposit.
     *
     * @return array<string, mixed>
     */
    private function creditInvoice(bool $useDeposit = true): array
    {
        return $this->postJson('/api/sales-invoices', [
            'date' => '2026-09-17',
            'customer_id' => $this->customer->id,
            'settlement_method' => 'receivable',
            'term_days' => 30,
            'use_deposit' => $useDeposit,
            'items' => [$this->item()],
        ])->assertCreated()->json('data');
    }

    /**
     * Invoice tunai 105 juta.
     *
     * @return array<string, mixed>
     */
    private function cashInvoice(bool $useDeposit = true, bool $withCashAccount = true): array
    {
        return $this->postJson('/api/sales-invoices', array_filter([
            'date' => '2026-09-17',
            'customer_id' => $this->customer->id,
            'settlement_method' => 'cash',
            'cash_account_id' => $withCashAccount ? $this->bank->id : null,
            'use_deposit' => $useDeposit,
            'items' => [$this->item()],
        ], fn ($value) => $value !== null))->assertCreated()->json('data');
    }

    /** @return array<string, mixed> */
    private function item(): array
    {
        return [
            'product_id' => Product::query()->where('code', 'PRD-TAL')->value('id'),
            'quantity' => '10000',
            'unit_price' => '10500',
        ];
    }
}
