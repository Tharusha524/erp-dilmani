<?php

namespace App\Http\Controllers;

use App\Http\Requests\JournalRequest;
use App\Repositories\All\Journal\JournalInterface;
use App\Support\CompanySetupSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JournalController extends Controller
{
    private JournalInterface $journalRepository;

    public function __construct(JournalInterface $journalRepository)
    {
        $this->journalRepository = $journalRepository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json($this->journalRepository->all());
    }

    /**
     * Search GL transactions with advanced filtering
     * Based on FrontAccounting's journal_inquiry logic
     */
    public function search(Request $request): JsonResponse
    {
        $filters = $request->only([
            'reference',
            'type',
            'fromDate',
            'toDate',
            'memo',
            'userId',
            'isPosted'
        ]);

        $results = $this->journalRepository->search($filters);

        return response()->json($results);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(JournalRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['currency'] = CompanySetupSettings::resolveCurrency($data['currency'] ?? null);
        $journal = $this->journalRepository->create($data);
        return response()->json($journal, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $journal = $this->journalRepository->find($id);
        if (!$journal) {
            return response()->json(['message' => 'Journal entry not found'], 404);
        }
        return response()->json($journal);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(JournalRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        if (array_key_exists('currency', $data)) {
            $data['currency'] = CompanySetupSettings::resolveCurrency($data['currency'] ?? null);
        }
        $updated = $this->journalRepository->update($id, $data);
        if (!$updated) {
            return response()->json(['message' => 'Journal entry not found or not updated'], 404);
        }
        return response()->json(['message' => 'Journal entry updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $deleted = $this->journalRepository->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Journal entry not found or could not be deleted'], 404);
        }
        return response()->json(['message' => 'Journal entry deleted successfully']);
    }

    /**
     * Delete a GL transaction by type + number (Journal Inquiry).
     */
    public function destroyTransaction(Request $request, int $transType, int $transNo): JsonResponse
    {
        $voidDate = $request->input('void_date', now()->toDateString());
        $memo = $request->input('memo');

        $deleted = $this->journalRepository->deleteTransaction($transType, $transNo, $voidDate, $memo);
        if (! $deleted) {
            return response()->json(['message' => 'Transaction not found or could not be voided'], 404);
        }

        return response()->json([
            'message' => 'Transaction voided successfully',
            'trans_type' => $transType,
            'trans_no' => $transNo,
        ]);
    }
}
