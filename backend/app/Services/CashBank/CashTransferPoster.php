<?php

namespace App\Services\CashBank;

use App\Enums\JournalSource;
use App\Enums\ReceiptStatus;
use App\Exceptions\CashTransferException;
use App\Models\Account;
use App\Models\CashTransfer;
use App\Models\JournalEntry;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use App\Services\DocumentNumberGenerator;
use Illuminate\Support\Facades\DB;

/**
 * Mencatat dan membatalkan transfer antar akun kas/bank.
 *
 * Kedua sisi jurnalnya akun kas, sehingga laporan arus kas harus memperlakukan
 * transfer sebagai pemindahan, bukan penerimaan maupun pengeluaran — itulah
 * sebabnya sumbernya ditandai CashTransfer, bukan CashReceipt atau CashPayment.
 */
final class CashTransferPoster
{
    private const PREFIX = 'TRF';

    public function __construct(
        private readonly JournalPoster $journals = new JournalPoster,
        private readonly DocumentNumberGenerator $numbers = new DocumentNumberGenerator,
    ) {}

    /** @throws CashTransferException */
    public function create(CashTransferData $data, User $user): CashTransfer
    {
        if ($data->fromAccountId === $data->toAccountId) {
            throw CashTransferException::sameAccount();
        }

        $from = Account::query()->findOrFail($data->fromAccountId);
        $to = Account::query()->findOrFail($data->toAccountId);

        foreach ([$from, $to] as $account) {
            if (! $account->is_cash) {
                throw CashTransferException::notACashAccount($account->code);
            }
        }

        return DB::transaction(function () use ($data, $user, $from, $to) {
            $transfer = new CashTransfer;
            $transfer->forceFill([
                'number' => $this->numbers->next(self::PREFIX, $data->date, CashTransfer::class),
                'date' => $data->date->toDateString(),
                'from_account_id' => $from->id,
                'to_account_id' => $to->id,
                'amount' => $data->amount,
                'reference' => $data->reference,
                'note' => $data->note,
                'status' => ReceiptStatus::Posted,
                'created_by' => $user->id,
            ])->save();

            $entry = $this->journals->post(new JournalDraft(
                date: $transfer->date,
                description: "Transfer {$transfer->number} · {$from->name} → {$to->name}",
                lines: [
                    JournalLineDraft::debit($to->code, $data->amount, "Transfer dari {$from->name}"),
                    JournalLineDraft::credit($from->code, $data->amount, "Transfer ke {$to->name}"),
                ],
                createdBy: $user->id,
                source: JournalSource::CashTransfer,
                sourceId: $transfer->id,
                sourceNumber: $transfer->number,
                paymentMethod: 'Transfer',
            ));

            $transfer->forceFill(['journal_entry_id' => $entry->id])->save();

            return $transfer->refresh();
        });
    }

    /** @throws CashTransferException */
    public function cancel(CashTransfer $transfer, User $user): CashTransfer
    {
        if ($transfer->isCancelled()) {
            throw CashTransferException::alreadyCancelled($transfer->number);
        }

        return DB::transaction(function () use ($transfer, $user) {
            $original = $transfer->journalEntry()->with('lines.account')->firstOrFail();

            $this->journals->post(new JournalDraft(
                date: $transfer->date,
                description: "Pembatalan {$transfer->number}",
                lines: $this->reversalLines($original),
                createdBy: $user->id,
                source: JournalSource::CashTransfer,
                sourceId: $transfer->id,
                sourceNumber: $transfer->number,
            ));

            $transfer->forceFill(['status' => ReceiptStatus::Cancelled])->save();

            return $transfer->refresh();
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
