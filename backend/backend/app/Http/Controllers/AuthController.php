<?php

namespace App\Http\Controllers;

use App\Http\Requests\AuthRequest;
use App\Repositories\All\Auth\AuthInterface;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    private AuthInterface $authRepo;

    public function __construct(AuthInterface $authRepo)
    {
        $this->authRepo = $authRepo;
    }

    public function login(AuthRequest $request)
    {
        $result = $this->authRepo->login($request->validated(), $request);

        if (isset($result['error']) && $result['error'] === true) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return response()->json($result);
    }

    public function logout(Request $request)
    {
        $this->authRepo->logout($request->user());

        return response()->json(['message' => 'Logged out successfully']);
    }
}
