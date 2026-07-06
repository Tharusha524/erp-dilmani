<?php

namespace App\Http\Controllers;

use App\Http\Requests\AccountTagRequest;
use App\Repositories\All\AccountTag\AccountTagInterface;

class AccountTagController extends Controller
{
    private AccountTagInterface $accountTagRepo;

    public function __construct(AccountTagInterface $accountTagRepo)
    {
        $this->accountTagRepo = $accountTagRepo;
    }

    public function index()
    {
        return response()->json($this->accountTagRepo->all(), 200);
    }

    public function store(AccountTagRequest $request)
    {
        $tag = $this->accountTagRepo->create($request->validated());
        return response()->json($tag, 201);
    }

    public function show(string $id)
    {
        $tag = $this->accountTagRepo->find($id);
        if (!$tag) {
            return response()->json(['message' => 'Not Found'], 404);
        }
        return response()->json($tag, 200);
    }

    public function update(AccountTagRequest $request, string $id)
    {
        $tag = $this->accountTagRepo->find($id);
        if (!$tag) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->accountTagRepo->update($id, $request->validated());
        return response()->json($tag->refresh(), 200);
    }

    public function destroy(string $id)
    {
        $tag = $this->accountTagRepo->find($id);
        if (!$tag) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->accountTagRepo->delete($id);
        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
