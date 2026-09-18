<?php

namespace App\Services\Deposits;

use App\Enums\DepositMovement;
use App\Enums\JournalSource;
use App\Enums\ReceiptStatus;
use App\Exceptions\CustomerDepositException;
use App\Models\Account;
use App\Models\CustomerDeposit;
use App\Models\JournalEntry;
use App\Models\SalesInvoice;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use App\Services\DocumentNumberGenerator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Mencatat mutasi kartu deposit pelanggan.
 *
 * Deposit diterima sebelum ada invoice, sehingga dicatat sebagai **kewajiban**,
 * bukan pendapatan — perusahaan masih berutang barang kepada customernya.
 * Pendapatan baru diakui ketika invoicenya terbit dan depositnya terpakai.
 */
final class CustomerDepositPoster
{
    private const PREFIX = 'DEP';

    public function __construct(
        private readonly JournalPoster $journals = new JournalPoster,
        private readonly DocumentNumberGenerator $numbers = new DocumentNumberGenerator,
    ) {}

    /**
     * Mencatat deposit masuk atau pengembalian deposit.
     *
     * @throws CustomerDepositException
     */
    public function create(CustomerDepositData $data, User $user): CustomerDeposit
    {
        $account = $this->validate($data);

        return DB::transaction(function () use ($data, $user, $account) {
            $deposit = $this->store($data, $user);
            $deposit->loadMissing('customer');

            $party = $deposit->customer->name;
            $isIncoming = $data->movement->isIncoming();

            $entry = $this->journals->post(new JournalDraft(
                date: $data->date,
                description: "{$data->movement->label()} {$deposit->number} · {$party}",
                lines: $isIncoming
                    ? [
                        JournalLineDraft::debit($account->code, $data->amount, "Deposit masuk · {$party}"),
                        JournalLineDraft::credit($this->depositAccount(), $data->amount, "Deposit · {$party}"),
                    ]
                    : [
                        JournalLineDraft::debit($this->depositAccount(), $data->amount, "Pengembalian deposit · {$party}"),
                        JournalLineDraft::credit($account->code, $data->amount, "Pengembalian · {$party}"),
                    ],
                createdBy: $user->id,
                source: JournalSource::CustomerDeposit,
                sourceId: $deposit->id,
                sourceNumber: $deposit->number,
                paymentMethod: $account->name,
            ));

            $deposit->forceFill(['journal_entry_id' => $entry->id])->save();

            return $deposit->refresh();
        });
    }

    /**
     * Mencatat pemakaian deposit pada sebuah invoice.
     *
     * Tidak membentuk jurnal sendiri: potongannya sudah menjadi salah satu
     * baris debit pada jurnal invoicenya. Baris kartu ini hanya membuat
     * pemakaiannya dapat ditelusuri dan mengurangi saldo depositnya.
     */
    public function recordApplication(SalesInvoice $invoice, string $amount, User $user): CustomerDeposit
    {
        $deposit = new CustomerDeposit;
        $deposit->forceFill([
            'number' => $this->numbers->next(self::PREFIX, $invoice->date, CustomerDeposit::class),
            'date' => $invoice->date->toDateString(),
            'customer_id' => $invoice->customer_id,
            'movement' => DepositMovement::Applied,
            'amount' => $amount,
            'sales_invoice_id' => $invoice->id,
            'note' => "Digunakan pada {$invoice->number}",
            'status' => ReceiptStatus::Posted,
            'journal_entry_id' => $invoice->journal_entry_id,
            'created_by' => $user->id,
        ])->save();

        return $deposit;
    }

    /**
     * Membatalkan mutasi deposit yang dibuat pengguna.
     *
     * @throws CustomerDepositException
     */
    public function cancel(CustomerDeposit $deposit, User $user): CustomerDeposit
    {
        if ($deposit->isCancelled()) {
            throw CustomerDepositException::alreadyCancelled($deposit->number);
        }

        if ($deposit->movement === DepositMovement::Applied) {
            throw CustomerDepositException::systemMovement($deposit->number);
        }

        // Membatalkan deposit masuk berarti menarik kembali saldo yang mungkin
        // sudah dipakai invoice. Ditolak bila saldonya tidak lagi mencukupi.
        if ($deposit->movement->isIncoming()) {
            $balance = CustomerDeposit::balanceOf($deposit->customer_id);

            if (bccomp($balance, (string) $deposit->amount, 2) < 0) {
                throw CustomerDepositException::balanceWouldGoNegative($deposit->number);
            }
        }

        return DB::transaction(function () use ($deposit, $user) {
            $original = $deposit->journalEntry()->with('lines.account')->firstOrFail();

            $this->journals->post(new JournalDraft(
                date: $deposit->date,
                description: "Pembatalan {$deposit->number}",
                lines: $this->reversalLines($original),
                createdBy: $user->id,
                source: JournalSource::CustomerDeposit,
                sourceId: $deposit->id,
                sourceNumber: $deposit->number,
            ));

            $deposit->forceFill(['status' => ReceiptStatus::Cancelled])->save();

            return $deposit->refresh();
        });
    }

    /**
     * Membatalkan pemakaian deposit milik sebuah invoice.
     *
     * Dipanggil ketika invoicenya dibatalkan: saldo depositnya harus kembali
     * tersedia. Jurnalnya tidak dibalik di sini — pembalikan sudah dikerjakan
     * oleh pembatalan invoicenya, yang memuat baris deposit itu.
     */
    public function releaseApplications(SalesInvoice $invoice): void
    {
        CustomerDeposit::query()
            ->posted()
            ->where('movement', DepositMovement::Applied)
            ->where('sales_invoice_id', $invoice->id)
            ->each(fn (CustomerDeposit $deposit) => $deposit->forceFill([
                'status' => ReceiptStatus::Cancelled,
            ])->save());
    }

    /** @throws CustomerDepositException */
    private function validate(CustomerDepositData $data): Account
    {
        if (bccomp($data->amount, '0', 2) <= 0) {
            throw CustomerDepositException::nonPositiveAmount();
        }

        $account = Account::query()->findOrFail($data->cashAccountId);

        if (! $account->is_cash) {
            throw CustomerDepositException::notACashAccount($account->code);
        }

        if (! $data->movement->isIncoming()) {
            $balance = CustomerDeposit::balanceOf($data->customerId);

            if (bccomp($data->amount, $balance, 2) > 0) {
                throw CustomerDepositException::insufficientBalance($balance);
            }
        }

        return $account;
    }

    private function store(CustomerDepositData $data, User $user): CustomerDeposit
    {
        $deposit = new CustomerDeposit;
        $deposit->forceFill([
            'number' => $this->numbers->next(self::PREFIX, $data->date, CustomerDeposit::class),
            'date' => $data->date->toDateString(),
            'customer_id' => $data->customerId,
            'movement' => $data->movement,
            'amount' => $data->amount,
            'cash_account_id' => $data->cashAccountId,
            'reference' => $data->reference,
            'note' => $data->note,
            'status' => ReceiptStatus::Posted,
            'created_by' => $user->id,
        ])->save();

        return $deposit;
    }

    private function depositAccount(): string
    {
        return config('triplastindo.accounts.customer_deposit');
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

    /** Nomor mutasi berikutnya untuk tanggal tersebut. */
    public function nextNumber(Carbon $date): string
    {
        return $this->numbers->next(self::PREFIX, $date, CustomerDeposit::class);
    }
}
