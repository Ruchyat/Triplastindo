<?php

use App\Http\Controllers\Accounting\JournalEntryController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Deposits\CustomerDepositController;
use App\Http\Controllers\Purchases\PurchaseBillController;
use App\Http\Controllers\Receivables\PaymentReceiptController;
use App\Http\Controllers\Sales\SalesInvoiceController;
use App\Http\Controllers\Setup\AccountController;
use App\Http\Controllers\Setup\CustomerController;
use App\Http\Controllers\Setup\ProductController;
use App\Http\Controllers\Setup\PurchaseCategoryController;
use App\Http\Controllers\Setup\SupplierController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rute API Triplastindo Finance
|--------------------------------------------------------------------------
|
| Seluruh rute di berkas ini berawalan `/api`. Bentuk permintaan dan
| jawabannya didokumentasikan pada md-file/triplastindo-kontrak-api.md.
|
| Pembatasan per peran belum dipasang: kolom `role` sudah tersimpan, tetapi
| matriks hak aksesnya dikerjakan setelah modul transaksinya lengkap.
|
*/

// Rute publik ------------------------------------------------------------

Route::post('/login', [AuthController::class, 'login'])->name('login');

// Rute yang memerlukan token Bearer --------------------------------------

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me'])->name('me');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::post('/logout-all', [AuthController::class, 'logoutAll'])->name('logout.all');

    // Master data --------------------------------------------------------

    Route::get('/account-categories', [AccountController::class, 'categories'])->name('account-categories.index');
    Route::get('/accounts', [AccountController::class, 'index'])->name('accounts.index');
    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
    Route::get('/purchase-categories', [PurchaseCategoryController::class, 'index'])
        ->name('purchase-categories.index');

    // Jurnal Umum --------------------------------------------------------

    Route::get('/journal-entries/summary', [JournalEntryController::class, 'summary'])
        ->name('journal-entries.summary');
    Route::apiResource('journal-entries', JournalEntryController::class)
        ->only(['index', 'show', 'store', 'destroy']);

    // Penjualan ----------------------------------------------------------

    Route::get('/sales-invoices/summary', [SalesInvoiceController::class, 'summary'])
        ->name('sales-invoices.summary');
    Route::post('/sales-invoices/{sales_invoice}/post', [SalesInvoiceController::class, 'post'])
        ->name('sales-invoices.post');
    Route::post('/sales-invoices/{sales_invoice}/cancel', [SalesInvoiceController::class, 'cancel'])
        ->name('sales-invoices.cancel');
    Route::apiResource('sales-invoices', SalesInvoiceController::class)
        ->only(['index', 'show', 'store', 'destroy']);

    // Penerimaan pembayaran ------------------------------------------------

    Route::post('/payment-receipts/{payment_receipt}/cancel', [PaymentReceiptController::class, 'cancel'])
        ->name('payment-receipts.cancel');
    Route::apiResource('payment-receipts', PaymentReceiptController::class)
        ->only(['index', 'show', 'store']);

    // Pembelian ------------------------------------------------------------

    Route::get('/purchase-bills/summary', [PurchaseBillController::class, 'summary'])
        ->name('purchase-bills.summary');
    Route::post('/purchase-bills/{purchase_bill}/post', [PurchaseBillController::class, 'post'])
        ->name('purchase-bills.post');
    Route::post('/purchase-bills/{purchase_bill}/cancel', [PurchaseBillController::class, 'cancel'])
        ->name('purchase-bills.cancel');
    Route::apiResource('purchase-bills', PurchaseBillController::class)
        ->only(['index', 'show', 'store', 'destroy']);

    // Deposit pelanggan ----------------------------------------------------

    Route::get('/customer-deposits/customers', [CustomerDepositController::class, 'customers'])
        ->name('customer-deposits.customers');
    Route::get('/customer-deposits/summary', [CustomerDepositController::class, 'summary'])
        ->name('customer-deposits.summary');
    Route::post('/customer-deposits/{customer_deposit}/cancel', [CustomerDepositController::class, 'cancel'])
        ->name('customer-deposits.cancel');
    Route::apiResource('customer-deposits', CustomerDepositController::class)
        ->only(['index', 'show', 'store']);
});
