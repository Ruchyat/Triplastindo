<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Satu sisi debit atau kredit sebuah jurnal.
 *
 * Seperti JournalEntry, baris jurnal hanya dibuat lewat JournalPoster.
 *
 * @property string $debit
 * @property string $credit
 * @property Carbon $date
 */
class JournalLine extends Model
{
    protected function casts(): array
    {
        return [
            // decimal:2 mengembalikan string, bukan float, supaya nilai uang
            // tetap utuh sampai ke perhitungan laporan.
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
            'date' => 'date',
        ];
    }

    /** @return BelongsTo<JournalEntry, $this> */
    public function entry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    /** @return BelongsTo<Account, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function isDebit(): bool
    {
        return bccomp((string) $this->debit, '0', 2) > 0;
    }

    /** Nilai baris, dari sisi mana pun ia berada. */
    public function amount(): string
    {
        return $this->isDebit() ? (string) $this->debit : (string) $this->credit;
    }
}
