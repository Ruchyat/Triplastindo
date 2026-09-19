<?php

use App\Http\Controllers\Accounting\JournalEntryController;
use App\Http\Controllers\Accounting\LedgerController;
use App\Http\Controllers\Assets\FixedAssetController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CashBank\CashAccountController;
use App\Http\Controllers\CashBank\CashTransferController;
use App\Http\Controllers\Deposits\CustomerDepositController;
use App\Http\Controllers\Expenses\ExpenseController;
use App\Http\Controllers\Inventory\InventoryController;
use App\Http\Controllers\Payables\SupplierPaymentController;
use App\Http\Controllers\Payroll\EmployeeController;
use App\Http\Controllers\Payroll\PayrollController;
use App\Http\Controllers\ProfitSharing\DividendController;
use App\Http\Controllers\ProfitSharing\ShareholderController;
use App\Http\Controllers\Purchases\PurchaseBillController;
use App\Http\Controllers\Receivables\PaymentReceiptController;
use App\Http\Controllers\Reports\DashboardController;
use App\Http\Controllers\Reports\ReportController;
use App\Http\Controllers\Sales\SalesInvoiceController;
use App\Http\Controllers\Setup\AccountController;
use App\Http\Controllers\Setup\CustomerController;
use App\Http\Controllers\Setup\FiscalPeriodController;
use App\Http\Controllers\Setup\OpeningBalanceController;
use App\Http\Controllers\Setup\ProductController;
use App\Http\Controllers\Setup\PurchaseCategoryController;
use App\Http\Controllers\Setup\SettingController;
use App\Http\Controllers\Setup\SupplierController;
use App\Http\Controllers\Setup\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rute API Triplastindo Finance
|--------------------------------------------------------------------------
|
| Seluruh rute di berkas ini berawalan `/api`. Bentuk permintaan dan
| jawabannya didokumentasikan pada md-file/triplastindo-kontrak-api.md.
|
| Pembatasan per peran mengikuti matriks bagian 4 dokumen spesifikasi;
| Super Admin selalu lolos (lihat EnsureRole). Ringkasnya:
|
|   finance  : seluruh transaksi, jurnal, laporan, aset, inventory, master data
|   hr       : karyawan, payroll, slip gaji
|   direksi  : baca semuanya, menyetujui dividen
|   viewer   : dashboard, laporan, dividen miliknya sendiri
|
*/

// Rute publik ------------------------------------------------------------

Route::post('/login', [AuthController::class, 'login'])->name('login');

// Rute yang memerlukan token Bearer --------------------------------------

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me'])->name('me');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::post('/logout-all', [AuthController::class, 'logoutAll'])->name('logout.all');

    // Referensi yang dibaca semua peran (dropdown form) --------------------

    Route::get('/account-categories', [AccountController::class, 'categories'])->name('account-categories.index');
    Route::get('/accounts', [AccountController::class, 'index'])->name('accounts.index');
    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
    Route::get('/product-categories', [ProductController::class, 'categories'])->name('product-categories.index');
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/purchase-categories', [PurchaseCategoryController::class, 'index'])->name('purchase-categories.index');
    Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');

    // Dashboard dan laporan: semua kecuali HR ------------------------------

    Route::middleware('role:finance,direksi,viewer')->group(function () {
        Route::get('/dashboard', DashboardController::class)->name('dashboard');
        Route::get('/reports/profit-loss', [ReportController::class, 'profitLoss'])->name('reports.profit-loss');
        Route::get('/reports/balance-sheet', [ReportController::class, 'balanceSheet'])->name('reports.balance-sheet');
        Route::get('/reports/cash-flow', [ReportController::class, 'cashFlow'])->name('reports.cash-flow');
    });

    // Bacaan transaksi, jurnal, buku besar: finance dan direksi ------------

    Route::middleware('role:finance,direksi')->group(function () {
        Route::get('/ledger', [LedgerController::class, 'index'])->name('ledger.index');
        Route::get('/ledger/{account}', [LedgerController::class, 'show'])->name('ledger.show');
        Route::get('/journal-entries/summary', [JournalEntryController::class, 'summary'])->name('journal-entries.summary');
        Route::apiResource('journal-entries', JournalEntryController::class)->only(['index', 'show']);

        Route::get('/sales-invoices/summary', [SalesInvoiceController::class, 'summary'])->name('sales-invoices.summary');
        Route::apiResource('sales-invoices', SalesInvoiceController::class)->only(['index', 'show']);
        Route::apiResource('payment-receipts', PaymentReceiptController::class)->only(['index', 'show']);
        Route::get('/customer-deposits/customers', [CustomerDepositController::class, 'customers'])->name('customer-deposits.customers');
        Route::get('/customer-deposits/summary', [CustomerDepositController::class, 'summary'])->name('customer-deposits.summary');
        Route::apiResource('customer-deposits', CustomerDepositController::class)->only(['index', 'show']);

        Route::get('/purchase-bills/summary', [PurchaseBillController::class, 'summary'])->name('purchase-bills.summary');
        Route::apiResource('purchase-bills', PurchaseBillController::class)->only(['index', 'show']);
        Route::apiResource('supplier-payments', SupplierPaymentController::class)->only(['index', 'show']);

        Route::get('/expenses/summary', [ExpenseController::class, 'summary'])->name('expenses.summary');
        Route::apiResource('expenses', ExpenseController::class)->only(['index', 'show']);

        Route::get('/cash-accounts', [CashAccountController::class, 'index'])->name('cash-accounts.index');
        Route::get('/cash-mutations', [CashAccountController::class, 'mutations'])->name('cash-mutations.index');
        Route::apiResource('cash-transfers', CashTransferController::class)->only(['index', 'show']);

        Route::get('/asset-types', [FixedAssetController::class, 'types'])->name('asset-types.index');
        Route::get('/fixed-assets/schedule', [FixedAssetController::class, 'schedule'])->name('fixed-assets.schedule');
        Route::apiResource('fixed-assets', FixedAssetController::class)->only(['index', 'show']);

        Route::get('/inventory/summary', [InventoryController::class, 'summary'])->name('inventory.summary');
        Route::get('/stock-movements', [InventoryController::class, 'movements'])->name('stock-movements.index');

        Route::get('/fiscal-periods', [FiscalPeriodController::class, 'index'])->name('fiscal-periods.index');
        Route::get('/opening-balances', [OpeningBalanceController::class, 'index'])->name('opening-balances.index');
    });

    // Tulis transaksi, jurnal, aset, inventory, master data: finance ---------

    Route::middleware('role:finance')->group(function () {
        Route::apiResource('journal-entries', JournalEntryController::class)->only(['store', 'destroy']);

        Route::post('/sales-invoices/{sales_invoice}/post', [SalesInvoiceController::class, 'post'])->name('sales-invoices.post');
        Route::post('/sales-invoices/{sales_invoice}/cancel', [SalesInvoiceController::class, 'cancel'])->name('sales-invoices.cancel');
        Route::apiResource('sales-invoices', SalesInvoiceController::class)->only(['store', 'destroy']);
        Route::post('/payment-receipts/{payment_receipt}/cancel', [PaymentReceiptController::class, 'cancel'])->name('payment-receipts.cancel');
        Route::apiResource('payment-receipts', PaymentReceiptController::class)->only(['store']);
        Route::post('/customer-deposits/{customer_deposit}/cancel', [CustomerDepositController::class, 'cancel'])->name('customer-deposits.cancel');
        Route::apiResource('customer-deposits', CustomerDepositController::class)->only(['store']);

        Route::post('/purchase-bills/{purchase_bill}/post', [PurchaseBillController::class, 'post'])->name('purchase-bills.post');
        Route::post('/purchase-bills/{purchase_bill}/cancel', [PurchaseBillController::class, 'cancel'])->name('purchase-bills.cancel');
        Route::apiResource('purchase-bills', PurchaseBillController::class)->only(['store', 'destroy']);
        Route::post('/supplier-payments/{supplier_payment}/cancel', [SupplierPaymentController::class, 'cancel'])->name('supplier-payments.cancel');
        Route::apiResource('supplier-payments', SupplierPaymentController::class)->only(['store']);

        Route::post('/expenses/{expense}/cancel', [ExpenseController::class, 'cancel'])->name('expenses.cancel');
        Route::apiResource('expenses', ExpenseController::class)->only(['store']);
        Route::post('/cash-transfers/{cash_transfer}/cancel', [CashTransferController::class, 'cancel'])->name('cash-transfers.cancel');
        Route::apiResource('cash-transfers', CashTransferController::class)->only(['store']);

        Route::post('/asset-types', [FixedAssetController::class, 'storeType'])->name('asset-types.store');
        Route::put('/asset-types/{asset_type}', [FixedAssetController::class, 'updateType'])->name('asset-types.update');
        Route::post('/fixed-assets/depreciations', [FixedAssetController::class, 'runDepreciation'])->name('fixed-assets.depreciate');
        Route::delete('/fixed-assets/depreciations', [FixedAssetController::class, 'undoDepreciation'])->name('fixed-assets.undo-depreciation');
        Route::post('/fixed-assets/{fixed_asset}/dispose', [FixedAssetController::class, 'dispose'])->name('fixed-assets.dispose');
        Route::apiResource('fixed-assets', FixedAssetController::class)->only(['store', 'update']);

        Route::post('/stock-movements', [InventoryController::class, 'store'])->name('stock-movements.store');
        Route::delete('/stock-movements/{stock_movement}', [InventoryController::class, 'destroy'])->name('stock-movements.destroy');

        Route::apiResource('accounts', AccountController::class)->only(['store', 'update']);
        Route::apiResource('customers', CustomerController::class)->only(['store', 'update']);
        Route::apiResource('products', ProductController::class)->only(['store', 'update']);
        Route::apiResource('suppliers', SupplierController::class)->only(['store', 'update']);

        Route::post('/fiscal-periods/close', [FiscalPeriodController::class, 'close'])->name('fiscal-periods.close');
        Route::post('/opening-balances', [OpeningBalanceController::class, 'store'])->name('opening-balances.store');
    });

    // Karyawan dan payroll: HR (finance dan direksi hanya membaca) ----------

    Route::middleware('role:hr,finance,direksi')->group(function () {
        Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
        Route::get('/payroll-runs/summary', [PayrollController::class, 'summary'])->name('payroll-runs.summary');
        Route::apiResource('payroll-runs', PayrollController::class)->only(['index', 'show']);
    });

    Route::middleware('role:hr')->group(function () {
        Route::apiResource('employees', EmployeeController::class)->only(['store', 'update']);
        Route::apiResource('payroll-runs', PayrollController::class)->only(['store']);
        Route::put('/payroll-runs/{payroll_run}/items', [PayrollController::class, 'updateItems'])->name('payroll-runs.items');
        Route::delete('/payroll-runs/{payroll_run}/items/{employee}', [PayrollController::class, 'removeItem'])->name('payroll-runs.remove-item');
        Route::post('/payroll-runs/{payroll_run}/post', [PayrollController::class, 'post'])->name('payroll-runs.post');
        Route::post('/payroll-runs/{payroll_run}/cancel', [PayrollController::class, 'cancel'])->name('payroll-runs.cancel');
    });

    // Bagi hasil ---------------------------------------------------------

    Route::middleware('role:finance,direksi')->group(function () {
        // Dideklarasikan sebelum resource agar tidak tertangkap `{dividend_decision}`.
        Route::get('/dividend-decisions/checkpoints', [DividendController::class, 'checkpoints'])->name('dividend-decisions.checkpoints');
        Route::get('/shareholders', [ShareholderController::class, 'index'])->name('shareholders.index');
    });
    Route::middleware('role:finance,direksi,viewer')->group(function () {
        Route::apiResource('dividend-decisions', DividendController::class)->only(['index', 'show']);
    });
    Route::middleware('role:finance')->group(function () {
        Route::apiResource('dividend-decisions', DividendController::class)->only(['store']);
        Route::post('/dividend-decisions/{dividend_decision}/cancel', [DividendController::class, 'cancel'])->name('dividend-decisions.cancel');
    });
    Route::middleware('role:direksi')->group(function () {
        Route::post('/dividend-decisions/{dividend_decision}/approve', [DividendController::class, 'approve'])->name('dividend-decisions.approve');
    });

    // Hanya Super Admin ----------------------------------------------------

    Route::middleware('role:')->group(function () {
        Route::put('/settings', [SettingController::class, 'update'])->name('settings.update');
        Route::post('/fiscal-periods/reopen', [FiscalPeriodController::class, 'reopen'])->name('fiscal-periods.reopen');
        Route::apiResource('shareholders', ShareholderController::class)->only(['store', 'update']);
        Route::get('/user-roles', [UserController::class, 'roles'])->name('user-roles.index');
        Route::apiResource('users', UserController::class)->only(['index', 'store', 'update']);
    });
});
