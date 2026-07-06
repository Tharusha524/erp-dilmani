<?php

namespace App\Repositories\All\Auth;

use App\Models\UserManagement;
use Illuminate\Http\Request;

interface AuthInterface
{
    public function login(array $credentials, ?Request $request = null): ?array;

    public function logout(UserManagement $user): bool;
}
