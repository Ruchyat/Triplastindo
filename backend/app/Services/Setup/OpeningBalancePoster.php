<?php

namespace App\Services\Setup;

use App\Enums\JournalSource;
use App\Enums\NormalBalance;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Saldo awal: satu jurnal bersumber `opening_balance` yang mengisi saldo tiap
 * akun neraca per tanggal mulai memakai aplikasi.
 *
 * Tiap akun diisi searah saldo normalnya; selisih debit–kredit ditampung akun
 * Saldo Penyesuaian Awal Ekuitas supaya jurnalnya tetap seimbang. Hanya akun
 * neraca yang boleh diisi — akun laba rugi memulai tahun dari nol.
 */
final class OpeningBalancePoster
{
    public function __construct(private readonly JournalPoster $journals = new JournalPoster) {}

    /**
     * @param  list<array{account_code: string, amount: string}>  $rows
     */
    public function post(Carbon $date, array $rows, User $user): JournalEntry
    {
        $debits = [];
        $credits = [];
        $totalDebit = '0.00';
        $totalCredit = '0.00';

        foreach ($rows as $row) {
            $amount = bcadd((string) $row['amount'], '0', 2);
            if (bccomp($amount, '0', 2) === 0) {
                continue;
            }

            $account = Account::query()->with('category')->where('code', $row['account_code'])->firstOrFail();

            if ($account->category->group->isTemporary()) {
                throw ValidationException::withMessages([
                    'rows' => "Akun {$account->code} adalah akun laba rugi; saldo awal hanya untuk akun neraca.",
                ]);
            }

            // Saldo negatif berarti berlawanan dengan saldo normal akun.
            $side = $account->normal_balance;
            if (bccomp($amount, '0', 2) < 0) {
                $amount = bcmul($amount, '-1', 2);
                $side = $side === NormalBalance::Debit ? NormalBalance::Kredit : NormalBalance::Debit;
            }

            if ($side === NormalBalance::Debit) {
                $debits[] = JournalLineDraft::debit($account->code, $amount, 'Saldo awal');
                $totalDebit = bcadd($totalDebit, $amount, 2);
            } else {
                $credits[] = JournalLineDraft::credit($account->code, $amount, 'Saldo awal');
                $totalCredit = bcadd($totalCredit, $amount, 2);
            }
        }

        $difference = bcsub($totalDebit, $totalCredit, 2);
        $equity = config('triplastindo.accounts.opening_equity');

        if (bccomp($difference, '0', 2) > 0) {
            $credits[] = JournalLineDraft::credit($equity, $difference, 'Penyeimbang saldo awal');
        } elseif (bccomp($difference, '0', 2) < 0) {
            $debits[] = JournalLineDraft::debit($equity, bcmul($difference, '-1', 2), 'Penyeimbang saldo awal');
        }

        if ($debits === [] && $credits === []) {
            throw ValidationException::withMessages(['rows' => 'Tidak ada saldo yang diisi.']);
        }

        return $this->journals->post(new JournalDraft(
            date: $date,
            description: 'Saldo awal per '.$date->translatedFormat('d F Y'),
            lines: [...$debits, ...$credits],
            createdBy: $user->id,
            source: JournalSource::OpeningBalance,
        ));
    }
}
