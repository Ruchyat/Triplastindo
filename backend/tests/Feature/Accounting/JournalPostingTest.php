<?php

namespace Tests\Feature\Accounting;

use App\Enums\JournalTagging;
use App\Enums\PeriodStatus;
use App\Exceptions\JournalPostingException;
use App\Models\Account;
use App\Models\FiscalPeriod;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use Database\Seeders\ChartOfAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Menguji satu janji yang menopang seluruh pembukuan: tidak ada jurnal yang
 * masuk ke database kecuali ia sah. Pengujian modul-modul di atasnya nanti
 * boleh bersandar pada jaminan ini dan tidak perlu mengulanginya.
 */
class JournalPostingTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ChartOfAccountSeeder::class);
        $this->user = User::factory()->create();
    }

    public function test_jurnal_seimbang_tersimpan_dengan_nomor_urut_dan_tagging_kas(): void
    {
        $poster = new JournalPoster;

        $first = $poster->post($this->draft('2026-09-17', [
            JournalLineDraft::debit('1-10003', 1_500_000),   // Bank BCA
            JournalLineDraft::credit('4-10000', 1_500_000),  // Penjualan Tali
        ]));

        $second = $poster->post($this->draft('2026-09-20', [
            JournalLineDraft::debit('5-10000', 900_000),     // Pemakaian Bahan Baku
            JournalLineDraft::credit('1-10201', 900_000),    // Persediaan
        ]));

        $this->assertSame('JU/2026/09/0001', $first->number);
        $this->assertSame('JU/2026/09/0002', $second->number);

        // Jurnal pertama menyentuh Bank BCA, jurnal kedua tidak menyentuh kas
        // sama sekali — Laporan Arus Kas hanya boleh menghitung yang pertama.
        $this->assertSame(JournalTagging::KasBank, $first->tagging);
        $this->assertSame(JournalTagging::NonKasBank, $second->tagging);

        $this->assertTrue($first->isBalanced());
        $this->assertSame('1500000.00', $first->totalDebit());
        $this->assertCount(2, $first->lines);
    }

    public function test_jurnal_tidak_seimbang_ditolak_dan_tidak_menyisakan_baris(): void
    {
        $this->expectException(JournalPostingException::class);

        try {
            (new JournalPoster)->post($this->draft('2026-09-17', [
                JournalLineDraft::debit('1-10003', 1_000_000),
                JournalLineDraft::credit('4-10000', 999_999),
            ]));
        } finally {
            $this->assertDatabaseCount('journal_entries', 0);
            $this->assertDatabaseCount('journal_lines', 0);
        }
    }

    public function test_akun_nonaktif_tidak_dapat_dipakai(): void
    {
        Account::query()->where('code', '4-10000')->update(['is_active' => false]);

        $this->expectException(JournalPostingException::class);
        $this->expectExceptionMessage('4-10000');

        (new JournalPoster)->post($this->draft('2026-09-17', [
            JournalLineDraft::debit('1-10003', 1_000_000),
            JournalLineDraft::credit('4-10000', 1_000_000),
        ]));
    }

    public function test_periode_yang_sudah_ditutup_menolak_jurnal_baru(): void
    {
        FiscalPeriod::query()->create([
            'year' => 2026,
            'month' => 9,
            'status' => PeriodStatus::Closed,
            'closed_by' => $this->user->id,
            'closed_at' => now(),
        ]);

        $this->expectException(JournalPostingException::class);
        $this->expectExceptionMessage('09/2026');

        (new JournalPoster)->post($this->draft('2026-09-17', [
            JournalLineDraft::debit('1-10003', 1_000_000),
            JournalLineDraft::credit('4-10000', 1_000_000),
        ]));
    }

    /** @param  list<JournalLineDraft>  $lines */
    private function draft(string $date, array $lines): JournalDraft
    {
        return new JournalDraft(
            date: Carbon::parse($date),
            description: 'Uji posting jurnal',
            lines: $lines,
            createdBy: $this->user->id,
        );
    }
}
