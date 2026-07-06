<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostSupplierCreditNoteRequest;
use App\Services\Purchasing\SupplierCreditNoteService;
use App\Services\Purchasing\SupplierTransactionEditService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class SupplierCreditNoteController extends Controller
{
    public function __construct(
        private SupplierCreditNoteService $creditNotes,
        private SupplierTransactionEditService $editService,
    ) {}

    public function store(PostSupplierCreditNoteRequest $request): JsonResponse
    {
        try {
            return response()->json($this->creditNotes->create($request->validated()), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to post supplier credit note.', 'error' => $e->getMessage()], 500);
        }
    }

    public function void(int $transNo): JsonResponse
    {
        try {
            return response()->json($this->creditNotes->void($transNo, request()->input('memo')));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function update(int $transNo): JsonResponse
    {
        try {
            return response()->json($this->editService->updateSuppDocument(21, $transNo, request()->all()));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to update supplier credit note.', 'error' => $e->getMessage()], 500);
        }
    }
}
