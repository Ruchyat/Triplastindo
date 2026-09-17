<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

/**
 * Autentikasi berbasis token Sanctum.
 *
 * Alurnya: `POST /api/login` mengembalikan token Bearer, frontend menyimpannya
 * dan mengirimkannya pada setiap permintaan berikutnya. `POST /api/logout`
 * mencabut token yang sedang dipakai.
 */
class AuthController extends Controller
{
    /** Batas percobaan login sebelum diblokir sementara. */
    private const MAX_ATTEMPTS = 5;

    /** Lama pemblokiran setelah batas percobaan terlampaui, dalam detik. */
    private const LOCKOUT_SECONDS = 60;

    /** Menukar email dan kata sandi dengan token akses. */
    public function login(LoginRequest $request): JsonResponse
    {
        $this->ensureIsNotRateLimited($request);

        $user = User::where('email', $request->string('email'))->first();

        // Hash selalu diperiksa walau user tidak ditemukan, supaya waktu respons
        // tidak membocorkan email mana yang terdaftar.
        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            RateLimiter::hit($this->throttleKey($request), self::LOCKOUT_SECONDS);

            throw ValidationException::withMessages([
                'email' => 'Email atau kata sandi salah.',
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'Akun ini tidak aktif. Hubungi Super Admin.',
            ]);
        }

        RateLimiter::clear($this->throttleKey($request));
        $user->markLoggedIn();

        return response()->json([
            'token' => $user->createToken($request->deviceName())->plainTextToken,
            'user' => new UserResource($user),
        ]);
    }

    /** Data user yang sedang masuk. */
    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    /** Mencabut token yang sedang dipakai, sehingga tidak bisa dipakai lagi. */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    /** Mencabut seluruh token user, misalnya ketika perangkat hilang. */
    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Seluruh sesi telah dikeluarkan.']);
    }

    /** Menolak percobaan login berlebihan dari kombinasi email dan IP yang sama. */
    private function ensureIsNotRateLimited(LoginRequest $request): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey($request), self::MAX_ATTEMPTS)) {
            return;
        }

        $seconds = RateLimiter::availableIn($this->throttleKey($request));

        throw ValidationException::withMessages([
            'email' => "Terlalu banyak percobaan login. Coba lagi dalam {$seconds} detik.",
        ]);
    }

    private function throttleKey(LoginRequest $request): string
    {
        return 'login:'.mb_strtolower($request->string('email')).'|'.$request->ip();
    }
}
