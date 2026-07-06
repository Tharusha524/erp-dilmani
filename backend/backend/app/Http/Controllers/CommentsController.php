<?php

namespace App\Http\Controllers;

use App\Http\Requests\CommentsRequest;
use App\Repositories\All\Comments\CommentsInterface;
use Illuminate\Http\JsonResponse;

class CommentsController extends Controller
{
    private CommentsInterface $commentsRepo;

    public function __construct(CommentsInterface $commentsRepo)
    {
        $this->commentsRepo = $commentsRepo;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->commentsRepo->all());
    }

    public function store(CommentsRequest $request): JsonResponse
    {
        $comment = $this->commentsRepo->create($request->validated());
        return response()->json($comment, 201);
    }
}
