<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\AssetType;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\FixedAsset;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\SalesInvoice;
use App\Models\Shareholder;
use App\Models\Supplier;
use App\Models\User;
use App\Services\Assets\DepreciationRunner;
use App\Services\CashBank\CashTransferData;
use App\Services\CashBank\CashTransferPoster;
use App\Services\Expenses\ExpenseData;
use App\Services\Expenses\ExpensePoster;
use App\Services\Inventory\StockLedger;
use App\Services\Payables\SupplierPaymentData;
use App\Services\Payables\SupplierPaymentPoster;
use App\Services\Payroll\PayrollPoster;
use App\Services\ProfitSharing\DividendService;
use App\Services\Purchases\PurchaseBillData;
use App\Services\Purchases\PurchaseBillPoster;
use App\Services\Receivables\PaymentReceiptData;
use App\Services\Receivables\PaymentReceiptPoster;
use App\Services\Sales\SalesInvoiceData;
use App\Services\Sales\SalesInvoicePoster;
use App\Services\Setup\OpeningBalancePoster;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

/**
 * Data contoh tahun 2026 supaya seluruh halaman langsung berisi.
 *
 * Saldo awal per 1 April 2026 mengikuti angka tab LAPORAN NERACA sheet; aset,
 * karyawan, dan pemegang saham mengikuti tab SETUP dan ASET & DEPRESIASI.
 * Transaksi April–September dibuat lewat service yang sama dengan aplikasi,
 * sehingga jurnal, stok, dan laporannya konsisten. Jalankan ulang dengan
 * `php artisan migrate:fresh --seed` — data ini memang untuk dihapus sebelum
 * dipakai sungguhan; COA dan master data dari seeder lain tetap dipertahankan.
 */
class DemoDataSeeder extends Seeder
{
    private User $finance;

    private User $hr;

    private User $direksi;

    /** @var array<string, int> */
    private array $accounts;

    public function run(): void
    {
        $this->accounts = Account::query()->pluck('id', 'code')->all();
        $this->seedUsers();
        $this->seedEmployees();
        $this->seedShareholders();
        $this->seedOpeningBalance();
        $this->seedAssets();
        $this->seedOpeningStock();

        foreach ([4, 5, 6, 7, 8, 9] as $month) {
            $this->seedMonth($month);
        }

        $this->seedDividend();

        $this->command?->info('Data contoh 2026 tersemai: April–September.');
    }

    private function seedUsers(): void
    {
        $make = fn (string $email, string $name, UserRole $role) => User::query()->updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => Hash::make('password'), 'role' => $role, 'is_active' => true, 'email_verified_at' => now()],
        );

        $this->finance = $make('finance@triplastindo.com', 'Rina Finance', UserRole::Finance);
        $this->hr = $make('hr@triplastindo.com', 'Dewi HR', UserRole::Hr);
        $this->direksi = $make('direksi@triplastindo.com', 'Koh Yadie', UserRole::Direksi);
        $make('viewer@triplastindo.com', 'Pak Satria', UserRole::Viewer);
    }

    private function seedEmployees(): void
    {
        $rows = [
            ['EMP-001', 'Jawad', 'produksi', 'Operator Mesin', 4_500_000, 500_000],
            ['EMP-002', 'Wilson', 'produksi', 'Operator Mesin', 4_500_000, 500_000],
            ['EMP-003', 'William', 'produksi', 'Supervisor Produksi', 7_200_000, 800_000],
            ['EMP-004', 'Koh Amen', 'kantor', 'Direktur Operasional', 15_000_000, 0],
            ['EMP-005', 'Christoper', 'kantor', 'Staff Admin & Finance', 6_000_000, 500_000],
            ['EMP-006', 'Subki', 'lapangan', 'Tim Lapang', 4_200_000, 250_000],
        ];

        foreach ($rows as [$nik, $name, $dept, $position, $basic, $allowance]) {
            Employee::query()->updateOrCreate(['nik' => $nik], [
                'name' => $name, 'department' => $dept, 'position' => $position, 'employment_status' => 'tetap',
                'joined_at' => '2026-01-05', 'basic_salary' => $basic, 'allowance' => $allowance,
                'expense_account_id' => $this->accounts[config("triplastindo.payroll_accounts.{$dept}")],
            ]);
        }
    }

    private function seedShareholders(): void
    {
        foreach ([['Koh Yadie', 1_440_000, 'direksi@triplastindo.com'], ['Pak Satria', 1_200_000, 'viewer@triplastindo.com'], ['Koh Apin', 760_000, null], ['Pak Andri', 200_000, null]] as [$name, $shares, $email]) {
            Shareholder::query()->updateOrCreate(['name' => $name], [
                'shares' => $shares,
                'user_id' => $email ? User::query()->where('email', $email)->value('id') : null,
            ]);
        }
    }

    /** Neraca per 1 April 2026 (tab LAPORAN NERACA); ekuitas menjadi penyeimbang. */
    private function seedOpeningBalance(): void
    {
        (new OpeningBalancePoster)->post(Carbon::parse('2026-04-01'), [
            ['account_code' => '1-10002', 'amount' => '755000'],
            ['account_code' => '1-10003', 'amount' => '185473425'],
            ['account_code' => '1-10103', 'amount' => '6117000'],
            ['account_code' => '1-10200', 'amount' => '42222000'],
            ['account_code' => '1-10301', 'amount' => '170000000'],
            ['account_code' => '1-20001', 'amount' => '1030200000'],
            ['account_code' => '1-20003', 'amount' => '465000000'],
            ['account_code' => '1-20004', 'amount' => '2418500000'],
            ['account_code' => '1-20005', 'amount' => '82000000'],
            ['account_code' => '1-20007', 'amount' => '33850000'],
            ['account_code' => '1-20008', 'amount' => '42650000'],
            ['account_code' => '2-10001', 'amount' => '196714000'],
            ['account_code' => '3-10000', 'amount' => '3600000000'],
        ], $this->finance);
    }

    /** Aset dari tab ASET & DEPRESIASI, dicatat sebagai saldo awal (nilainya sudah ada di neraca awal). */
    private function seedAssets(): void
    {
        $types = AssetType::query()->pluck('id', 'name');
        $assets = [
            ['BGP-01', 'Bangunan Pabrik Kedaung', 'Bangunan Pabrik', 1_030_200_000],
            ['KDR-01', 'Truk Operasional', 'Kendaraan Ops.', 465_000_000],
            ['MCC-01', 'Mesin Cacah 1', 'Mesin Biji', 50_000_000],
            ['MCC-02', 'Mesin Cacah 2', 'Mesin Biji', 50_000_000],
            ['MCC-03', 'Mesin Cacah 3', 'Mesin Biji', 135_000_000],
            ['MCC-04', 'Mesin Cacah 4', 'Mesin Biji', 100_000_000],
            ['MBK-01', 'Mesin Bak Cuci 1', 'Mesin Biji', 10_000_000],
            ['MBK-02', 'Mesin Bak Cuci 2', 'Mesin Biji', 10_000_000],
            ['MSK-01', 'Mesin Sentrik 1', 'Mesin Biji', 58_000_000],
            ['MSK-02', 'Mesin Sentrik 2', 'Mesin Biji', 58_000_000],
            ['MSK-03', 'Mesin Konveyor Baling 3', 'Mesin Biji', 80_000_000],
            ['MPR-01', 'Mesin Proses 1 + Potong 1', 'Mesin Biji', 700_000_000],
            ['MPR-02', 'Mesin Proses 2 + Potong 2', 'Mesin Biji', 700_000_000],
            ['MPR-03', 'Mesin Proses 3', 'Mesin Biji', 467_500_000],
            ['MTL-01', 'Mesin Tali Line 1', 'Mesin Produksi Tali', 20_000_000],
            ['MTL-02', 'Mesin Tali Line 2', 'Mesin Produksi Tali', 20_000_000],
            ['MTL-03', 'Mesin Tali Line 3', 'Mesin Produksi Tali', 20_000_000],
            ['MXB-01', 'Mesin Mix Bahan 1', 'Mesin Produksi Tali', 7_000_000],
            ['MOV-01', 'Mesin Oven 1–6', 'Mesin Produksi Tali', 15_000_000],
            ['MAP-01', 'Mesin Asah Pisau 1', 'Peralatan Produksi', 5_000_000],
            ['TBD-01', 'Timbangan Digital', 'Peralatan Produksi', 28_850_000],
            ['ACM-01', 'AC Meeting Room', 'Peralatan Kantor', 12_650_000],
            ['MJD-01', 'Meja & Kursi Direktur', 'Peralatan Kantor', 30_000_000],
        ];

        $rate = (string) config('triplastindo.settings.parameters.residual_value_rate');

        foreach ($assets as [$code, $name, $type, $cost]) {
            $years = AssetType::query()->find($types[$type])->default_useful_life_years;
            FixedAsset::query()->updateOrCreate(['code' => $code], [
                'name' => $name,
                'asset_type_id' => $types[$type],
                'acquisition_date' => '2026-04-01',
                'in_use_date' => '2026-04-01',
                'cost' => $cost,
                'residual_value' => bcmul((string) $cost, $rate, 2),
                'useful_life_months' => $years * 12,
            ]);
        }
    }

    private function seedOpeningStock(): void
    {
        $kw = Product::query()->where('code', 'PRD-BBK')->firstOrFail();
        (new StockLedger)->adjust($kw, Carbon::parse('2026-04-01'), 'in', '8444.400', '5000.00', 'Saldo awal stok', $this->finance, 'opening');
    }

    private function seedMonth(int $month): void
    {
        $bank = $this->accounts['1-10003'];
        $petty = $this->accounts['1-10002'];
        $day = fn (int $d) => sprintf('2026-%02d-%02d', $month, $d);
        $growth = 1 + ($month - 4) * 0.08;

        $polos = Product::query()->where('code', 'PRD-BBP')->firstOrFail();
        $karung = Product::query()->where('code', 'PRD-KRG')->firstOrFail();
        $tali = Product::query()->where('code', 'PRD-TAL')->firstOrFail();
        $biji = Product::query()->where('code', 'PRD-BIJ')->firstOrFail();
        $supplierKarung = Supplier::query()->where('code', 'SUP-002')->firstOrFail();
        $supplierPendukung = Supplier::query()->where('code', 'SUP-003')->firstOrFail();
        $supplierPlastik = Supplier::query()->where('code', 'SUP-001')->firstOrFail();
        $customers = Customer::query()->orderBy('code')->get();

        $purchases = new PurchaseBillPoster;
        $sales = new SalesInvoicePoster;
        $stock = new StockLedger;
        $expenses = new ExpensePoster;

        // 1. Pembelian bahan baku bertermin dan bahan pendukung tunai.
        $bahanKg = (int) round(60_000 * $growth);
        $billBahan = $purchases->create(PurchaseBillData::fromRequest([
            'date' => $day(2), 'supplier_id' => $supplierKarung->id, 'category' => 'bahan_baku_polos',
            'settlement_method' => 'payable', 'term_days' => 30, 'supplier_invoice_number' => "NOTA-{$month}01",
            'items' => [['product_id' => $polos->id, 'quantity' => (string) $bahanKg, 'unit_price' => '5200']],
        ]), $this->finance);

        $purchases->create(PurchaseBillData::fromRequest([
            'date' => $day(4), 'supplier_id' => $supplierPendukung->id, 'category' => 'bahan_pendukung',
            'settlement_method' => 'cash', 'cash_account_id' => $bank,
            'items' => [['product_id' => $karung->id, 'quantity' => '3000', 'unit_price' => '2100']],
        ]), $this->finance);

        $purchases->create(PurchaseBillData::fromRequest([
            'date' => $day(6), 'supplier_id' => $supplierPlastik->id, 'category' => 'sparepart',
            'settlement_method' => 'cash', 'cash_account_id' => $bank,
            'items' => [['product_id' => Product::query()->where('code', 'PRD-SPR')->value('id'), 'quantity' => '1', 'unit_price' => (string) (int) (15_000_000 * $growth)]],
        ]), $this->finance);

        // 2. Produksi: pakai bahan, hasilkan biji dan tali.
        $stock->consume($polos, Carbon::parse($day(8)), (string) (int) ($bahanKg * 0.9), 'Pemakaian bahan baku produksi', $this->finance);
        $stock->consume($karung, Carbon::parse($day(8)), '2800', 'Karung kemasan barang jadi', $this->finance);
        $stock->produce($biji, Carbon::parse($day(12)), (string) (int) ($bahanKg * 0.55), 'Hasil produksi biji plastik', $this->finance);
        $stock->produce($tali, Carbon::parse($day(18)), (string) (int) ($bahanKg * 0.25), 'Hasil produksi tali', $this->finance);

        // 3. Penjualan: tali bertermin ke dua customer, biji tunai ke dua lainnya.
        $taliKg = (int) round($bahanKg * 0.22);
        $bijiKg = (int) round($bahanKg * 0.5);

        $invoiceKredit = $sales->create(SalesInvoiceData::fromRequest([
            'date' => $day(14), 'customer_id' => $customers[0]->id, 'settlement_method' => 'receivable', 'term_days' => 30,
            'items' => [['product_id' => $tali->id, 'quantity' => (string) $taliKg, 'unit_price' => '17300']],
        ]), $this->finance);

        $sales->create(SalesInvoiceData::fromRequest([
            'date' => $day(16), 'customer_id' => $customers[2]->id, 'settlement_method' => 'cash', 'cash_account_id' => $bank,
            'items' => [['product_id' => $biji->id, 'quantity' => (string) (int) ($bijiKg * 0.6), 'unit_price' => '12300']],
        ]), $this->finance);

        $sales->create(SalesInvoiceData::fromRequest([
            'date' => $day(22), 'customer_id' => $customers[1]->id, 'settlement_method' => 'receivable', 'term_days' => 14,
            'items' => [['product_id' => $biji->id, 'quantity' => (string) (int) ($bijiKg * 0.4), 'unit_price' => '12100']],
        ]), $this->finance);

        // 4. Pelunasan invoice bertermin bulan lalu dan pembayaran tagihan bahan baku bulan lalu.
        $previousInvoices = SalesInvoice::query()->outstanding()
            ->whereDate('date', '<', $day(1))
            ->where('id', '!=', $invoiceKredit->id)
            ->get();
        foreach ($previousInvoices->groupBy('customer_id') as $customerId => $group) {
            (new PaymentReceiptPoster)->create(PaymentReceiptData::fromRequest([
                'date' => $day(10), 'customer_id' => $customerId, 'cash_account_id' => $bank, 'reference' => "TRF-IN-{$month}",
                'allocations' => $group->map(fn ($inv) => ['sales_invoice_id' => $inv->id, 'amount' => $inv->outstandingAmount()])->values()->all(),
            ]), $this->finance);
        }

        $previousBills = PurchaseBill::query()->outstanding()->whereDate('date', '<', $day(1))->where('id', '!=', $billBahan->id)->get();
        foreach ($previousBills->groupBy('supplier_id') as $supplierId => $group) {
            (new SupplierPaymentPoster)->create(SupplierPaymentData::fromRequest([
                'date' => $day(20), 'supplier_id' => $supplierId, 'cash_account_id' => $bank, 'reference' => "TRF-OUT-{$month}",
                'allocations' => $group->map(fn ($bill) => ['purchase_bill_id' => $bill->id, 'amount' => $bill->outstandingAmount()])->values()->all(),
            ]), $this->finance);
        }

        // 5. Pengeluaran rutin.
        foreach ([
            ['5-11003', 'Listrik produksi', 'PLN', (int) (125_000_000 * $growth), 15],
            ['5-11011', 'Biaya timbang, QC, uang jalan', null, 3_000_000, 19],
            ['6-10007', 'Konsumsi karyawan', 'Warung Bu Tini', 4_560_000, 21],
            ['6-10008', 'Keamanan', 'Satpam', 5_500_000, 25],
            ['6-10009', 'Kebersihan', null, 9_900_000, 25],
            ['6-10012', 'Admin bank', 'Bank BCA', 88_000, 28],
        ] as [$code, $desc, $payee, $amount, $d]) {
            $expenses->create(ExpenseData::fromRequest([
                'date' => $day($d), 'expense_account_id' => $this->accounts[$code], 'cash_account_id' => $code === '6-10007' ? $petty : $bank,
                'description' => "{$desc} ".Carbon::parse($day(1))->translatedFormat('F'), 'payee' => $payee, 'amount' => (string) $amount,
            ]), $this->finance);
        }

        // 6. Isi petty cash dari bank.
        (new CashTransferPoster)->create(CashTransferData::fromRequest([
            'date' => $day(3), 'from_account_id' => $bank, 'to_account_id' => $petty, 'amount' => '6000000', 'reference' => 'Isi petty cash',
        ]), $this->finance);

        // 7. Payroll dan penyusutan bulan ini.
        $payroll = new PayrollPoster;
        $run = $payroll->createDraft(2026, $month, Carbon::parse($day(27)), $bank, $this->hr);
        $ops = Employee::query()->where('nik', 'EMP-001')->value('id');
        $payroll->updateItems($run, [
            ['employee_id' => $ops, 'overtime' => '350000', 'bpjs_health' => '45000', 'bpjs_employment' => '90000', 'loan_deduction' => $month === 5 ? '500000' : '0', 'loan_advance' => $month === 4 ? '1000000' : '0'],
            ['employee_id' => Employee::query()->where('nik', 'EMP-004')->value('id'), 'tax_pph21' => '450000', 'bpjs_health' => '150000'],
            ['employee_id' => Employee::query()->where('nik', 'EMP-005')->value('id'), 'tax_pph21' => '75000', 'bpjs_health' => '60000', 'bpjs_employment' => '120000'],
        ]);
        $payroll->post($run->refresh(), $this->hr);

        (new DepreciationRunner)->run(2026, $month, $this->finance);
    }

    /** Dividen Juni 100 juta, disetujui Direksi — mengikuti tab BAGI HASIL. */
    private function seedDividend(): void
    {
        $service = new DividendService;
        $decision = $service->propose([
            'year' => 2026, 'month' => 6, 'decision_date' => '2026-07-02', 'total_amount' => '100000000',
            'cash_account_id' => $this->accounts['1-10003'], 'note' => 'Pembagian laba semester I',
        ], $this->finance);
        $service->approve($decision, $this->direksi);
    }
}
