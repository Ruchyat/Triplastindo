<?php

namespace App\Providers;

use App\Services\Accounting\ClosedPeriodRegistry;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Umurnya satu permintaan, mengikuti umur container.
        $this->app->singleton(ClosedPeriodRegistry::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
