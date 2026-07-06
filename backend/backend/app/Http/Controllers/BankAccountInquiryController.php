<?php

namespace App\Http\Controllers;

use App\Repositories\All\BankTransInquiry\BankTransInquiryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BankAccountInquiryController extends Controller
{
    private BankTransInquiryInterface $bankTransInquiryRepository;

    public function __construct(BankTransInquiryInterface $bankTransInquiryRepository)
    {
        $this->bankTransInquiryRepository = $bankTransInquiryRepository;
    }

    /**
     * Search bank account transactions by account and date range
     */
    public function search(Request $request): JsonResponse
    {
        $filters = $request->only(['selectedAccount', 'fromDate', 'toDate']);
        $results = $this->bankTransInquiryRepository->search($filters);

        return response()->json($results);
    }
}
