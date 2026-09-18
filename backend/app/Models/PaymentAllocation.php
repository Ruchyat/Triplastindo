<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Bagian sebuah penerimaan yang dipakai melunasi satu invoice.
 *
 * @property string $amount
 */
class PaymentAllocation extends Model
{
    protected function casts(): array
    {
        return ['amount' => 'decimal:2'];
    }

    /** @return BelongsTo<PaymentReceipt, $this> */
    public function receipt(): BelongsTo
    {
        return $this->belongsTo(PaymentReceipt::class, 'payment_receipt_id');
    }

    /** @return BelongsTo<SalesInvoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class, 'sales_invoice_id');
    }
}
