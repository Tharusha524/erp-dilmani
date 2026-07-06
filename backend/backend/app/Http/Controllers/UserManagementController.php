<?php

namespace App\Http\Controllers;

use App\Repositories\All\UserManagement\UserManagementInterface;
use App\Http\Requests\UserManagementRequest;
use App\Models\UserManagement;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class UserManagementController extends Controller
{
    private UserManagementInterface $userRepo;

    public function __construct(UserManagementInterface $userRepo)
    {
        $this->userRepo = $userRepo;
    }

    public function index(): JsonResponse
    {
        $users = $this->userRepo->all();
        // Optionally: Loop to set image_url if not using model accessor
        return response()->json($users);
    }

    public function store(UserManagementRequest $request): JsonResponse
    {
        $data = $request->validated();
        // Remove manual bcrypt—model cast handles it

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('profile_images', 'public');
            $data['image'] = $path;
        }

        $user = $this->userRepo->create($data);
        return response()->json($user, 201);
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userRepo->find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        // image_url now auto-available via model accessor—no manual code needed

        return response()->json($user);
    }

    public function update(UserManagementRequest $request, int $id): JsonResponse
    {
        $user = $this->userRepo->find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $data = $request->validated();

        // Handle image update/replacement (for profile page)
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($user->image) {
                Storage::disk('public')->delete($user->image);
            }
            $path = $request->file('image')->store('profile_images', 'public');
            $data['image'] = $path;
        } elseif ($request->boolean('remove_image')) {
            // Explicit removal (no new upload)
            if ($user->image) {
                Storage::disk('public')->delete($user->image);
            }
            $data['image'] = null;
        }
        // If neither, keep existing image (don't overwrite with null)

        // Keep existing password unless a new one was submitted.
        $passwordChanging = filled($data['password'] ?? null);
        if (! $passwordChanging) {
            unset($data['password']);
        }

        $updated = $this->userRepo->update($id, $data);
        if (! $updated) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ($passwordChanging) {
            $user->tokens()->delete();
        }

        // Refresh user to get updated image_url
        $user->refresh();

        return response()->json([
            'message' => 'Updated successfully',
            'user' => $user // Include updated user with image_url
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = $this->userRepo->find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Delete image file if exists
        if ($user->image) {
            Storage::disk('public')->delete($user->image);
        }

        $deleted = $this->userRepo->delete($id);
        if (! $deleted) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['message' => 'User deleted']);
    }
}
