<?php

namespace App\Services\Assets;

use App\Enums\JournalSource;
use App\Models\Account;
use App\Models\AssetType;
use App\Models\FixedAsset;
use App\Models\Setting;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Membuat, menyunting, dan melepas aset tetap.
 *
 * Aset dapat dicatat dengan tiga cara: saldo awal (tanpa jurnal — nilainya
 * sudah ada di saldo awal neraca), pembelian tunai (D aset · K kas/bank),
 * atau pembelian bertermin (D aset · K Hutang Usaha). Pelepasan membalik
 * nilai perolehan dan akumulasinya; selisihnya menjadi rugi pelepasan.
 */
final class FixedAssetService
{
    public function __construct(private readonly JournalPoster $journals = new JournalPoster) {}

    /** @param  array<string, mixed>  $data */
    public function create(array $data, User $user): FixedAsset
    {
        $type = AssetType::query()->with('assetAccount')->findOrFail($data['asset_type_id']);
        $cost = bcadd((string) $data['cost'], '0', 2);

        $residual = isset($data['residual_value'])
            ? bcadd((string) $data['residual_value'], '0', 2)
            : bcmul($cost, (string) Setting::get('parameters')['residual_value_rate'], 2);

        $years = (int) ($data['useful_life_years'] ?? $type->default_useful_life_years);

        return DB::transaction(function () use ($data, $type, $cost, $residual, $years, $user) {
            $asset = FixedAsset::query()->create([
                'code' => $data['code'],
                'name' => $data['name'],
                'asset_type_id' => $type->id,
                'acquisition_date' => $data['acquisition_date'],
                'in_use_date' => $data['in_use_date'] ?? $data['acquisition_date'],
                'cost' => $cost,
                'residual_value' => $residual,
                'useful_life_months' => $years * 12,
                'opening_accumulated' => bcadd((string) ($data['opening_accumulated'] ?? 0), '0', 2),
                'note' => $data['note'] ?? null,
            ]);

            $funding = $data['funding'] ?? 'opening';
            if ($funding !== 'opening' && bccomp($cost, '0', 2) > 0) {
                $credit = $funding === 'cash'
                    ? Account::query()->findOrFail($data['cash_account_id'])->code
                    : config('triplastindo.accounts.payable');

                $entry = $this->journals->post(new JournalDraft(
                    date: Carbon::parse($asset->acquisition_date),
                    description: "Perolehan aset {$asset->code} · {$asset->name}",
                    lines: [
                        JournalLineDraft::debit($type->assetAccount->code, $cost, $asset->name),
                        JournalLineDraft::credit($credit, $cost, "Pembelian aset {$asset->code}"),
                    ],
                    createdBy: $user->id,
                    source: JournalSource::Manual,
                    sourceNumber: $asset->code,
                ));
                $asset->forceFill(['acquisition_journal_id' => $entry->id])->save();
            }

            return $asset;
        });
    }

    /** @param  array<string, mixed>  $data */
    public function update(FixedAsset $asset, array $data): FixedAsset
    {
        if ($asset->depreciations()->exists() && isset($data['cost']) && bccomp((string) $data['cost'], (string) $asset->cost, 2) !== 0) {
            throw ValidationException::withMessages([
                'cost' => 'Nominal aset yang sudah disusutkan tidak dapat diubah; lepaskan dan catat ulang.',
            ]);
        }

        $asset->fill([
            'code' => $data['code'] ?? $asset->code,
            'name' => $data['name'] ?? $asset->name,
            'asset_type_id' => $data['asset_type_id'] ?? $asset->asset_type_id,
            'acquisition_date' => $data['acquisition_date'] ?? $asset->acquisition_date,
            'in_use_date' => $data['in_use_date'] ?? $asset->in_use_date,
            'cost' => isset($data['cost']) ? bcadd((string) $data['cost'], '0', 2) : $asset->cost,
            'residual_value' => isset($data['residual_value']) ? bcadd((string) $data['residual_value'], '0', 2) : $asset->residual_value,
            'useful_life_months' => isset($data['useful_life_years']) ? (int) $data['useful_life_years'] * 12 : $asset->useful_life_months,
            'opening_accumulated' => isset($data['opening_accumulated']) ? bcadd((string) $data['opening_accumulated'], '0', 2) : $asset->opening_accumulated,
            'note' => $data['note'] ?? $asset->note,
        ])->save();

        return $asset;
    }

    /**
     * Melepas aset: nilai perolehan dan akumulasinya dikeluarkan dari neraca,
     * hasil penjualannya (bila ada) masuk kas, selisihnya rugi/laba pelepasan.
     */
    public function dispose(FixedAsset $asset, Carbon $date, string $proceeds, ?int $cashAccountId, User $user): FixedAsset
    {
        if (! $asset->isActive()) {
            throw ValidationException::withMessages(['asset' => "Aset {$asset->code} sudah dilepas."]);
        }

        $asset->loadMissing('type.assetAccount', 'type.accumulatedAccount');
        $accumulated = $asset->accumulatedDepreciation();
        $bookValue = $asset->bookValue();
        $proceeds = bcadd($proceeds, '0', 2);
        $difference = bcsub($proceeds, $bookValue, 2);

        return DB::transaction(function () use ($asset, $date, $proceeds, $cashAccountId, $accumulated, $difference, $user) {
            $debits = [];
            $credits = [JournalLineDraft::credit($asset->type->assetAccount->code, (string) $asset->cost, "Pelepasan {$asset->code}")];

            if (bccomp($accumulated, '0', 2) > 0) {
                $debits[] = JournalLineDraft::debit($asset->type->accumulatedAccount->code, $accumulated, "Akumulasi {$asset->code}");
            }
            if (bccomp($proceeds, '0', 2) > 0) {
                $cash = Account::query()->findOrFail($cashAccountId);
                $debits[] = JournalLineDraft::debit($cash->code, $proceeds, "Hasil pelepasan {$asset->code}");
            }
            if (bccomp($difference, '0', 2) < 0) {
                $debits[] = JournalLineDraft::debit(config('triplastindo.accounts.asset_disposal_loss'), bcmul($difference, '-1', 2), "Rugi pelepasan {$asset->code}");
            } elseif (bccomp($difference, '0', 2) > 0) {
                $credits[] = JournalLineDraft::credit('7-10099', $difference, "Laba pelepasan {$asset->code}");
            }

            $entry = $this->journals->post(new JournalDraft(
                date: $date,
                description: "Pelepasan aset {$asset->code} · {$asset->name}",
                lines: [...$debits, ...$credits],
                createdBy: $user->id,
                source: JournalSource::Manual,
                sourceNumber: $asset->code,
            ));

            $asset->forceFill(['status' => 'disposed', 'disposed_at' => $date->toDateString(), 'disposal_journal_id' => $entry->id])->save();

            return $asset;
        });
    }
}
