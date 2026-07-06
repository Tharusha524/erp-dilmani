<?php

namespace App\Http\Controllers;

use App\Repositories\All\TaxInquiry\TaxInquiryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TaxInquiryController extends Controller
{
    private TaxInquiryInterface $taxInquiryRepository;

    public function __construct(TaxInquiryInterface $taxInquiryRepository)
    {
        $this->taxInquiryRepository = $taxInquiryRepository;
    }

    /**
     * Search tax transactions by date range
     */
    public function search(Request $request): JsonResponse
    {
        $filters = $request->only(['fromDate', 'toDate']);
        $results = $this->taxInquiryRepository->search($filters);

        return response()->json($results);
    }
}
