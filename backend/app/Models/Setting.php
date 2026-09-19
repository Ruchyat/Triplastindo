<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Satu kunci pengaturan beserta nilainya (JSON).
 *
 * Nilai bawaan tiap kunci ada di `config('triplastindo.settings')`; `get()`
 * menggabungkan keduanya sehingga kunci yang belum pernah disimpan tetap
 * punya nilai.
 */
#[Fillable(['key', 'value'])]
class Setting extends Model
{
    protected $primaryKey = 'key';

    protected $keyType = 'string';

    public $incrementing = false;

    protected function casts(): array
    {
        return ['value' => 'array'];
    }

    /** @return array<string, mixed> */
    public static function get(string $key): array
    {
        $defaults = config("triplastindo.settings.{$key}", []);
        $stored = static::query()->find($key)?->value ?? [];

        return is_array($defaults) && array_is_list($defaults)
            ? ($stored ?: $defaults)
            : array_replace($defaults, is_array($stored) ? $stored : []);
    }

    /** @param  array<string, mixed>  $value */
    public static function put(string $key, array $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
    }

    /** @return array<string, array<string, mixed>> */
    public static function everything(): array
    {
        return collect(array_keys(config('triplastindo.settings')))
            ->mapWithKeys(fn (string $key) => [$key => static::get($key)])
            ->all();
    }
}
