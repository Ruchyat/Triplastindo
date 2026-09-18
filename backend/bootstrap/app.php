<?php

use App\Exceptions\CustomerDepositException;
use App\Exceptions\JournalPostingException;
use App\Exceptions\PaymentReceiptException;
use App\Exceptions\PurchaseBillException;
use App\Exceptions\SalesInvoiceException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Pelanggaran aturan akuntansi dan aturan dokumen dijawab 422, sama
        // seperti kegagalan validasi biasa. Bagi frontend keduanya memang
        // serupa: permintaannya sah secara bentuk, tetapi isinya ditolak —
        // dan pesannya sudah berbahasa Indonesia, siap ditampilkan apa adanya.
        $exceptions->render(
            fn (JournalPostingException|SalesInvoiceException|PaymentReceiptException|CustomerDepositException|PurchaseBillException $e) => response()->json([
                'message' => $e->getMessage(),
                'errors' => [],
            ], 422)
        );
    })->create();
