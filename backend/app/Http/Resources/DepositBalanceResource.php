<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Posisi deposit seorang customer.
 *
 * Bekerja di atas baris hasil agregasi, bukan model — angkanya dijumlahkan
 * database dalam satu kueri untuk seluruh customer sekaligus.
 *
 * Empat angkanya sengaja ditampilkan lengkap agar barisnya dapat dijumlah
 * sendiri oleh pembaca: masuk − terpakai − dikembalikan = saldo. Pengembalian
 * uang kepada customer adalah kejadian yang berbeda sifatnya dari pemakaian
 * pada invoice, sehingga tidak dilebur menjadi satu angka.
 */
class DepositBalanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $received = $this->money($this->received);
        $applied = $this->money($this->applied);
        $refunded = $this->money($this->refunded);

        return [
            'customer' => [
                'id' => $this->customer_id,
                'code' => $this->code,
                'name' => $this->name,
            ],
            'received' => $received,
            'applied' => $applied,
            'refunded' => $refunded,
            'balance' => bcsub(bcsub($received, $applied, 2), $refunded, 2),
            'last_activity' => $this->last_activity,
        ];
    }

    private function money(mixed $value): string
    {
        return bcadd((string) ($value ?? 0), '0', 2);
    }
}
