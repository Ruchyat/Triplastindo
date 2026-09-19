<?php

namespace App\Http\Controllers\Setup;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Pengguna dan perannya. Hanya Super Admin. */
class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(User::query()->orderBy('name')->get());
    }

    public function roles(): JsonResponse
    {
        return response()->json([
            'data' => array_map(fn (UserRole $role) => ['value' => $role->value, 'label' => $role->label()], UserRole::cases()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::enum(UserRole::class)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $user = User::query()->create([
            ...$data,
            'password' => Hash::make($data['password']),
            'is_active' => $data['is_active'] ?? true,
            'email_verified_at' => now(),
        ]);

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    public function update(Request $request, User $user): UserResource
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', Rule::enum(UserRole::class)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // Super Admin terakhir tidak boleh diturunkan atau dinonaktifkan.
        $demoting = $user->isSuperAdmin() && ($data['role'] !== UserRole::SuperAdmin->value || ($data['is_active'] ?? true) === false);
        if ($demoting && User::query()->where('role', UserRole::SuperAdmin)->where('is_active', true)->count() <= 1) {
            throw ValidationException::withMessages(['role' => 'Harus ada sedikitnya satu Super Admin aktif.']);
        }

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return new UserResource($user);
    }
}
