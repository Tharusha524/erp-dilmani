<?php

namespace App\Repositories\All\Reports;

use App\Repositories\Base\EloquentRepositoryInterface;
use Illuminate\Http\Request;

interface ReportsInterface extends EloquentRepositoryInterface
{
    /**
     * Get data for Customer Balances Report
     * 
     * @param Request $request
     * @return \Illuminate\Support\Collection
     */
    public function getCustomerBalancesData(Request $request);

    /**
     * Get data for Aged Customer Analysis Report (Report ID: 102)
     * 
     * @param Request $request
     * @return \Illuminate\Support\Collection
     */
    public function getAgedCustomerAnalysisData(Request $request);

    /**
     * Get data for Customer Trial Balance Report (Report ID: 115)
     * 
     * @param Request $request
     * @return \Illuminate\Support\Collection
     */
    public function getCustomerTrialBalanceData(Request $request);

    /**
     * Get data for Customer Detail Listing Report (Report ID: 103)
     * 
     * @param Request $request
     * @return \Illuminate\Support\Collection
     */
    public function getCustomerDetailListingData(Request $request);

    /**
     * Get data for Sales Summary Report (Report ID: 114)
     * 
     * @param Request $request
     * @return \Illuminate\Support\Collection
     */
    public function getSalesSummaryData(Request $request);

    /**
     * Get data for Aged Supplier Analysis Report (Report ID: 202)
     */
    public function getAgedSupplierAnalysisData(Request $request);
}
