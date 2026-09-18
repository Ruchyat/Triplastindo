<?php

namespace Tests\Feature\Receivables;

use App\Enums\DocumentStatus;
use App\Models\Account;
use App\Models\Customer;
use App\Models\JournalEntry;
use App\Models\Product;
use App\Models\SalesInvoice;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\MasterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Menguji penutupan siklus akrual: invoice membentuk piutang, penerimaan
 * menguranginya, dan pembatalan penerimaan mengembalikannya.
 */
class PaymentReceiptTest extends TestCase
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

    public function test_penerimaan_mengurangi_piutang_dan_melunaskan_invoice(): void
    {
        $invoice = $this->creditInvoice();
        $this->assertSame('105000000.00', $invoice['outstanding_amount']);

        $receipt = $this->postJson('/api/payment-receipts', [
            'date' => '2026-09-20',
            'customer_id' => $this->customer->id,
            'cash_account_id' => $this->bank->id,
            'reference' => 'TRF-889',
            'allocations' => [
                ['sales_invoice_id' => $invoice['id'], 'amount' => '105000000'],
            ],
        ])->assertCreated()->json('data');

        $this->assertSame('BKM/2026/09/0001', $receipt['number']);
        $this->assertSame('105000000.00', $receipt['amount']);

        // D Bank BCA · K Piutang Usaha
        $lines = collect($receipt['journal_entry']['lines']);
        $this->assertSame('105000000.00', $lines->firstWhere('account.code', '1-10003')['debit']);
        $this->assertSame('105000000.00', $lines->firstWhere('account.code', '1-10100')['credit']);

        $invoice = SalesInvoice::query()->find($invoice['id']);
        $this->assertSame(DocumentStatus::Paid, $invoice->status);
        $this->assertSame('0.00', $invoice->outstandingAmount());
    }

    public function test_pelunasan_sebagian_membuat_invoice_berstatus_sebagian(): void
    {
        $invoice = $this->creditInvoice();

        $this->postJson('/api/payment-receipts', [
            'date' => '2026-09-20',
            'customer_id' => $this->customer->id,
            'cash_account_id' => $this->bank->id,
            'allocations' => [
                ['sales_invoice_id' => $invoice['id'], 'amount' => '40000000'],
            ],
        ])->assertCreated();

        $invoice = SalesInvoice::query()->find($invoice['id']);
        $this->assertSame(DocumentStatus::Partial, $invoice->status);
        $this->assertSame('65000000.00', $invoice->outstandingAmount());
    }

    public function test_pelunasan_melebihi_sisa_piutang_ditolak(): void
    {
        $invoice = $this->creditInvoice();

        $this->postJson('/api/payment-receipts', [
            'date' => '2026-09-20',
            'customer_id' => $this->customer->id,
            'cash_account_id' => $this->bank->id,
            'allocations' => [
                ['sales_invoice_id' => $invoice['id'], 'amount' => '105000001'],
            ],
        ])->assertStatus(422);

        $this->assertDatabaseCount('payment_receipts', 0);
        $this->assertDatabaseCount('payment_allocations', 0);
        // Hanya jurnal invoicenya; penerimaannya tidak pernah terbentuk.
        $this->assertSame(1, JournalEntry::query()->count());
    }

    public function test_pembatalan_penerimaan_mengembalikan_piutang(): void
    {
        $invoice = $this->creditInvoice();

        $receipt = $this->postJson('/api/payment-receipts', [
            'date' => '2026-09-20',
            'customer_id' => $this->customer->id,
            'cash_account_id' => $this->bank->id,
            'allocations' => [
                ['sales_invoice_id' => $invoice['id'], 'amount' => '105000000'],
            ],
        ])->json('data');

        $this->postJson("/api/payment-receipts/{$receipt['id']}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $invoice = SalesInvoice::query()->find($invoice['id']);
        $this->assertSame(DocumentStatus::Unpaid, $invoice->status);
        $this->assertSame('105000000.00', $invoice->outstandingAmount());

        // Jurnal invoice, jurnal penerimaan, dan jurnal pembaliknya.
        $this->assertSame(3, JournalEntry::query()->count());
    }

    public function test_invoice_yang_sudah_menerima_pembayaran_tidak_dapat_dibatalkan(): void
    {
        $invoice = $this->creditInvoice();

        $this->postJson('/api/payment-receipts', [
            'date' => '2026-09-20',
            'customer_id' => $this->customer->id,
            'cash_account_id' => $this->bank->id,
            'allocations' => [
                ['sales_invoice_id' => $invoice['id'], 'amount' => '40000000'],
            ],
        ])->assertCreated();

        $this->postJson("/api/sales-invoices/{$invoice['id']}/cancel")
            ->assertStatus(422)
            ->assertJsonPath('message', fn (string $message) => str_contains($message, 'sudah menerima pembayaran'));
    }

    /**
     * Invoice kredit tanpa DP: seluruh nilainya menjadi piutang.
     *
     * @return array<string, mixed>
     */
    private function creditInvoice(): array
    {
        return $this->postJson('/api/sales-invoices', [
            'date' => '2026-09-17',
            'customer_id' => $this->customer->id,
            'settlement_method' => 'receivable',
            'term_days' => 30,
            'items' => [[
                'product_id' => Product::query()->where('code', 'PRD-TAL')->value('id'),
                'quantity' => '10000',
                'unit_price' => '10500',
            ]],
        ])->assertCreated()->json('data');
    }
}
