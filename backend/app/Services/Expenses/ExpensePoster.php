<?php

namespace App\Services\Expenses;

use App\Enums\AccountGroup;
use App\Enums\JournalSource;
use App\Enums\ReceiptStatus;
use App\Exceptions\ExpenseException;
use App\Models\Account;
use App\Models\Expense;
use App\Models\JournalEntry;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use App\Services\DocumentNumberGenerator;
use Illuminate\Support\Facades\DB;

/**
 * Mencatat dan membatalkan pengeluaran biaya.
 *
 * Jurnalnya paling sederhana di antara semua modul — beban bertambah, kas
 * berkurang — tetapi tetap lewat satu pintu supaya aturan akun beban dan akun
 * kas berlaku bagi pemanggil mana pun.
 */
final class ExpensePoster
{
    private const PREFIX = 'EXP';

    /** Kelompok akun yang boleh menjadi tujuan pengeluaran. */
    public const EXPENSE_GROUPS = [AccountGroup::Hpp, AccountGroup::Beban, AccountGroup::BebanLain, AccountGroup::Pajak];

    public function __construct(
        private readonly JournalPoster $journals = new JournalPoster,
        private readonly DocumentNumberGenerator $numbers = new DocumentNumberGenerator,
    ) {}

    /** @throws ExpenseException */
    public function create(ExpenseData $data, User $user): Expense
    {
        $cash = Account::query()->findOrFail($data->cashAccountId);
        $expense = Account::query()->with('category')->findOrFail($data->expenseAccountId);

        if (! $cash->is_cash) {
            throw ExpenseException::notACashAccount($cash->code);
        }

        if (! in_array($expense->category->group, self::EXPENSE_GROUPS, true)) {
            throw ExpenseException::notAnExpenseAccount($expense->code);
        }

        return DB::transaction(function () use ($data, $user, $cash, $expense) {
            $voucher = new Expense;
            $voucher->forceFill([
                'number' => $this->numbers->next(self::PREFIX, $data->date, Expense::class),
                'date' => $data->date->toDateString(),
                'expense_account_id' => $expense->id,
                'cash_account_id' => $cash->id,
                'payee' => $data->payee,
                'description' => $data->description,
                'amount' => $data->amount,
                'reference' => $data->reference,
                'note' => $data->note,
                'status' => ReceiptStatus::Posted,
                'created_by' => $user->id,
            ])->save();

            $party = $data->payee ? " · {$data->payee}" : '';

            $entry = $this->journals->post(new JournalDraft(
                date: $voucher->date,
                description: "Pengeluaran {$voucher->number} · {$data->description}",
                lines: [
                    JournalLineDraft::debit($expense->code, $data->amount, $data->description.$party),
                    JournalLineDraft::credit($cash->code, $data->amount, "Pembayaran{$party}"),
                ],
                createdBy: $user->id,
                source: JournalSource::Expense,
                sourceId: $voucher->id,
                sourceNumber: $voucher->number,
                paymentMethod: $cash->name,
            ));

            $voucher->forceFill(['journal_entry_id' => $entry->id])->save();

            return $voucher->refresh();
        });
    }

    /** @throws ExpenseException */
    public function cancel(Expense $voucher, User $user): Expense
    {
        if ($voucher->isCancelled()) {
            throw ExpenseException::alreadyCancelled($voucher->number);
        }

        return DB::transaction(function () use ($voucher, $user) {
            $original = $voucher->journalEntry()->with('lines.account')->firstOrFail();

            $this->journals->post(new JournalDraft(
                date: $voucher->date,
                description: "Pembatalan {$voucher->number}",
                lines: $this->reversalLines($original),
                createdBy: $user->id,
                source: JournalSource::Expense,
                sourceId: $voucher->id,
                sourceNumber: $voucher->number,
            ));

            $voucher->forceFill(['status' => ReceiptStatus::Cancelled])->save();

            return $voucher->refresh();
        });
    }

    /** @return list<JournalLineDraft> */
    private function reversalLines(JournalEntry $entry): array
    {
        $debits = [];
        $credits = [];

        foreach ($entry->lines as $line) {
            if ($line->isDebit()) {
                $credits[] = JournalLineDraft::credit($line->account->code, $line->amount(), $line->description);
            } else {
                $debits[] = JournalLineDraft::debit($line->account->code, $line->amount(), $line->description);
            }
        }

        return [...$debits, ...$credits];
    }
}
