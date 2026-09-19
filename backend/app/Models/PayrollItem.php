<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Gaji satu karyawan pada satu payroll. Rumus mengikuti tab GAJI KARYAWAN.
 *
 * @property string $gross
 * @property string $net
 * @property string $take_home
 */
#[Fillable([
    'payroll_run_id', 'employee_id', 'basic_salary', 'overtime', 'allowance', 'bonus',
    'loan_advance', 'tax_pph21', 'bpjs_employment', 'bpjs_health', 'loan_deduction',
    'gross', 'net', 'take_home',
])]
class PayrollItem extends Model
{
    public const AMOUNT_FIELDS = [
        'basic_salary', 'overtime', 'allowance', 'bonus', 'loan_advance',
        'tax_pph21', 'bpjs_employment', 'bpjs_health', 'loan_deduction',
    ];

    protected function casts(): array
    {
        return array_fill_keys([...self::AMOUNT_FIELDS, 'gross', 'net', 'take_home'], 'decimal:2');
    }

    /** @return BelongsTo<PayrollRun, $this> */
    public function run(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id');
    }

    /** @return BelongsTo<Employee, $this> */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /** Mengisi kotor, bersih, dan THP dari komponen-komponennya. */
    public function recalculate(): self
    {
        $sum = fn (string ...$fields) => array_reduce($fields, fn (string $s, string $f) => bcadd($s, (string) ($this->{$f} ?? 0), 2), '0.00');

        $this->gross = $sum('basic_salary', 'overtime', 'allowance', 'bonus');
        $this->net = bcsub($this->gross, $sum('tax_pph21', 'bpjs_employment', 'bpjs_health'), 2);
        $this->take_home = bcsub(bcadd($this->net, (string) $this->loan_advance, 2), (string) $this->loan_deduction, 2);

        return $this;
    }
}
