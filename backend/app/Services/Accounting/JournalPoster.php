<?php

namespace App\Services\Accounting;

use App\Enums\JournalTagging;
use App\Exceptions\JournalPostingException;
use App\Models\Account;
use App\Models\FiscalPeriod;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Services\DocumentNumberGenerator;
use Illuminate\Support\Facades\DB;

/**
 * Satu-satunya pintu masuk jurnal ke database.
 *
 * Seluruh aturan yang membuat pembukuan dapat dipercaya berkumpul di sini:
 * debit harus sama dengan kredit, akun harus terdaftar dan aktif, nominal
 * harus positif, dan periode harus terbuka. Modul lain tidak mengulang
 * pemeriksaan ini — mereka cukup menyusun JournalDraft.
 */
final class JournalPoster
{
    /** Awalan nomor bukti jurnal, sama untuk seluruh asal jurnal. */
    private const PREFIX = 'JU';

    public function __construct(
        private readonly DocumentNumberGenerator $numbers = new DocumentNumberGenerator,
    ) {}

    /** @throws JournalPostingException */
    public function post(JournalDraft $draft): JournalEntry
    {
        $accounts = $this->validate($draft);

        return DB::transaction(function () use ($draft, $accounts) {
            $entry = new JournalEntry;
            $entry->forceFill([
                'number' => $this->numbers->next(self::PREFIX, $draft->date, JournalEntry::class),
                'date' => $draft->date->toDateString(),
                'description' => $draft->description,
                'tagging' => $draft->tagging ?? $this->taggingFor($accounts),
                'source' => $draft->source,
                'source_id' => $draft->sourceId,
                'source_number' => $draft->sourceNumber,
                'payment_method' => $draft->paymentMethod,
                'attachment_path' => $draft->attachmentPath,
                'created_by' => $draft->createdBy,
            ])->save();

            foreach ($this->linePayload($draft, $accounts) as $attributes) {
                // forceFill, bukan create(): baris jurnal sengaja tidak dapat
                // diisi massal supaya tidak ada jalan lain menuju tabel ini.
                $entry->lines()->save((new JournalLine)->forceFill($attributes));
            }

            return $entry->load('lines.account');
        });
    }

    /**
     * Memeriksa seluruh aturan sebelum satu baris pun ditulis.
     *
     * @return array<string, Account> akun yang dipakai, terindeks kode
     *
     * @throws JournalPostingException
     */
    private function validate(JournalDraft $draft): array
    {
        if (count($draft->lines) < 2) {
            throw JournalPostingException::tooFewLines();
        }

        if (FiscalPeriod::isClosedOn($draft->date)) {
            throw JournalPostingException::closedPeriod($draft->date->year, $draft->date->month);
        }

        foreach ($draft->lines as $line) {
            $line->assertPositive();
        }

        $debit = $draft->totalDebit();
        $credit = $draft->totalCredit();

        // Dua jurnal debit saja dapat berjumlah sama dengan nol di sisi kredit
        // hanya bila keduanya nol, yang sudah ditolak di atas. Pemeriksaan ini
        // menjaga kasus yang lebih halus: seluruh baris berada di satu sisi.
        if (bccomp($debit, '0', 2) === 0 || bccomp($credit, '0', 2) === 0) {
            throw JournalPostingException::emptySide();
        }

        if (bccomp($debit, $credit, 2) !== 0) {
            throw JournalPostingException::unbalanced($debit, $credit);
        }

        return $this->resolveAccounts($draft);
    }

    /**
     * @return array<string, Account>
     *
     * @throws JournalPostingException
     */
    private function resolveAccounts(JournalDraft $draft): array
    {
        $accounts = Account::query()
            ->whereIn('code', $draft->accountCodes())
            ->get()
            ->keyBy('code');

        foreach ($draft->accountCodes() as $code) {
            $account = $accounts->get($code);

            if ($account === null) {
                throw JournalPostingException::unknownAccount($code);
            }

            if (! $account->is_active) {
                throw JournalPostingException::inactiveAccount($code);
            }
        }

        return $accounts->all();
    }

    /**
     * Jurnal dianggap menggerakkan kas bila menyentuh akun Kas & Bank.
     *
     * @param  array<string, Account>  $accounts
     */
    private function taggingFor(array $accounts): JournalTagging
    {
        foreach ($accounts as $account) {
            if ($account->is_cash) {
                return JournalTagging::KasBank;
            }
        }

        return JournalTagging::NonKasBank;
    }

    /**
     * @param  array<string, Account>  $accounts
     * @return list<array<string, mixed>>
     */
    private function linePayload(JournalDraft $draft, array $accounts): array
    {
        $payload = [];

        foreach ($draft->lines as $index => $line) {
            $payload[] = [
                'account_id' => $accounts[$line->accountCode()]->id,
                'debit' => $line->debitAmount(),
                'credit' => $line->creditAmount(),
                'description' => $line->description,
                'date' => $draft->date->toDateString(),
                'sort_order' => $index,
            ];
        }

        return $payload;
    }
}
