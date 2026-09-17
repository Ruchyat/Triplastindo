<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rute API Triplastindo Finance
|--------------------------------------------------------------------------
|
| Seluruh rute di berkas ini berawalan `/api`. Tahap ini baru memuat
| autentikasi; modul transaksi dan laporan menyusul.
|
*/

// Rute publik ------------------------------------------------------------

Route::post('/login', [AuthController::class, 'login'])->name('login');

// Rute yang memerlukan token Bearer --------------------------------------

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me'])->name('me');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::post('/logout-all', [AuthController::class, 'logoutAll'])->name('logout.all');
});
