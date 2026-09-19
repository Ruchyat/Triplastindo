<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Membatasi rute pada peran tertentu: `role:finance,direksi`.
 *
 * Super Admin selalu lolos. Matriks perannya ada di `routes/api.php`,
 * mengikuti bagian 4 dokumen spesifikasi.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if ($user === null) {
            throw new AccessDeniedHttpException('Belum masuk.');
        }

        if ($user->isSuperAdmin() || in_array($user->role->value, $roles, true)) {
            return $next($request);
        }

        throw new AccessDeniedHttpException(
            "Peran {$user->role->label()} tidak memiliki akses ke bagian ini.",
        );
    }
}
