<?php

use App\Enums\SettlementMethod;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Menyederhanakan metode pembayaran menjadi Tunai dan Piutang.
 *
 * "Bank" dan "Cash" sebelumnya dipisah, padahal keduanya sama-sama meminta
 * akun penerima lewat dropdown Kas & Bank — pilihannya tidak menambah
 * informasi apa pun. Invoice lama yang bermetode `bank` menjadi `cash`, yang
 * kini berarti "diselesaikan sekarang".
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('sales_invoices')->where('settlement_method', 'bank')->update([
            'settlement_method' => SettlementMethod::Cash->value,
        ]);

        $this->redefineColumn(SettlementMethod::forSales());
    }

    public function down(): void
    {
        $this->redefineColumn(['cash', 'bank', 'receivable']);
    }

    /**
     * Mengubah daftar nilai kolom enum.
     *
     * Ditulis sebagai SQL mentah karena `change()` pada kolom enum memerlukan
     * doctrine/dbal, dan MySQL sendiri sudah menyediakan MODIFY COLUMN.
     *
     * @param  list<string>  $values
     */
    private function redefineColumn(array $values): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        $list = implode(', ', array_map(fn (string $value) => "'{$value}'", $values));

        DB::statement("ALTER TABLE sales_invoices MODIFY settlement_method ENUM({$list}) NOT NULL");
    }
};
