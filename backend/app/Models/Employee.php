<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Karyawan. Departemen menentukan akun beban gaji bawaannya.
 *
 * @property string $nik
 * @property string $name
 * @property string $department
 * @property string $basic_salary
 * @property string $allowance
 * @property bool $is_active
 */
#[Fillable([
    'nik', 'name', 'department', 'position', 'employment_status', 'joined_at',
    'basic_salary', 'allowance', 'expense_account_id', 'bank_account', 'is_active',
])]
class Employee extends Model
{
    public const DEPARTMENTS = ['produksi' => 'Produksi', 'kantor' => 'Kantor', 'lapangan' => 'Lapangan'];

    public const STATUSES = ['tetap' => 'Tetap', 'kontrak' => 'Kontrak', 'harian' => 'Harian'];

    protected function casts(): array
    {
        return [
            'joined_at' => 'date',
            'basic_salary' => 'decimal:2',
            'allowance' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<Account, $this> */
    public function expenseAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'expense_account_id');
    }

    /** @return HasMany<PayrollItem, $this> */
    public function payrollItems(): HasMany
    {
        return $this->hasMany(PayrollItem::class);
    }

    /** Sisa kasbon: seluruh pinjaman yang sudah diposting dikurangi potongannya. */
    public function loanBalance(): string
    {
        $items = $this->payrollItems()
            ->whereHas('run', fn ($q) => $q->where('status', 'posted'))
            ->selectRaw('COALESCE(SUM(loan_advance), 0) as advances, COALESCE(SUM(loan_deduction), 0) as deductions')
            ->first();

        return bcsub((string) $items->advances, (string) $items->deductions, 2);
    }
}
