<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostSalesCreditNoteRequest;
use App\Services\Sales\SalesCreditNoteService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class SalesCreditNoteController extends Controller
{
    public function __construct(private SalesCreditNoteService $credits) {}

    public function store(PostSalesCreditNoteRequest $request): JsonResponse
    {
        try {
            return response()->json($this->credits->create($request->validated()), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to process credit note.', 'error' => $e->getMessage()], 500);
        }
    }

    public function void(int $transNo): JsonResponse
    {
        try {
            return response()->json($this->credits->void($transNo, request()->input('memo')));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function update(int $transNo): JsonResponse
    {
        try {
            return response()->json($this->credits->updatePosted($transNo, request()->all()));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to update credit note.', 'error' => $e->getMessage()], 500);
        }
    }
}
