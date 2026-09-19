<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pemegang saham. Persentase dihitung dari total saham aktif, tidak disimpan.
 *
 * @property string $name
 * @property int $shares
 * @property bool $is_active
 */
#[Fillable(['name', 'shares', 'user_id', 'is_active'])]
class Shareholder extends Model
{
    protected function casts(): array
    {
        return ['shares' => 'integer', 'is_active' => 'boolean'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
