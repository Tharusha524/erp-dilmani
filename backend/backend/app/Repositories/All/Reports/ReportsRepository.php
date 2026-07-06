<?php

namespace App\Repositories\All\Reports;

use App\Models\DebtorsMaster;
use App\Repositories\Base\BaseRepository;
use App\Support\ActiveFiscalYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportsRepository extends BaseRepository implements ReportsInterface
{
    public function __construct(DebtorsMaster $model)
    {
        parent::__construct($model);
    }

    /**
     * Get data for Customer Balances Report
     * 
     * @param Request $request
     * @return \Illuminate\Support\Collection
     */
    public function getCustomerBalancesData(Request $request)
    {
        $date = $request->input('endDate', now()->format('Y-m-d'));
        $from_customer = $request->input('from_customer');
        $to_customer = $request->input('to_customer');
        $currency = $request->input('currency', 'all');

        $query = DB::table('debtors_master as d')
            ->leftJoin('debtor_trans as t', 'd.debtor_no', '=', 't.debtor_no')
            ->select(
                'd.debtor_no',
                'd.name as name',
                'd.curr_code',
                DB::raw("SUM(IFNULL(t.ov_amount + t.ov_gst + t.ov_freight + t.ov_freight_tax + t.ov_discount, 0)) as total_amount"),
                DB::raw("SUM(IFNULL(t.alloc, 0)) as allocated")
            )
            ->where(function($q) use ($date) {
                $q->where('t.tran_date', '<=', $date)
                  ->orWhereNull('t.tran_date');
            })
            ->groupBy('d.debtor_no', 'd.name', 'd.curr_code');

        if ($from_customer) {
            $query->where('d.debtor_no', '>=', $from_customer);
        }
        if ($to_customer) {
            $query->where('d.debtor_no', '<=', $to_customer);
        }
        if ($currency !== 'all') {
            $query->where('d.curr_code', '=', $currency);
        }

        return $query->get()->map(function ($row) {
            $row->opening_balance = 0; // Fixed for the view
            $row->charges = $row->total_amount;
            $row->credits = $row->allocated;
            $row->balance = $row->total_amount - $row->allocated;
            return $row;
        })->filter(function ($row) {
            return abs($row->balance) > 0.001;
        });
    }

    /**
     * Get data for Aged Customer Analysis Report (Report ID: 102)
     */
    public function getAgedCustomerAnalysisData(Request $request)
    {
        $date = $request->input('endDate', now()->format('Y-m-d'));
        $from_customer = $request->input('from_customer');
        $to_customer = $request->input('to_customer');
        $currency = $request->input('currency', 'all');
        $show_all = $request->input('showAll', 'No') === 'Yes';

        // Aging intervals (typical FA defaults or from sys_prefs)
        $past_due_days = 30; // Usually dynamic in FA
        $past_due_days2 = 60;

        $query = DB::table('debtors_master as d')
            ->leftJoin('debtor_trans as t', 'd.debtor_no', '=', 't.debtor_no')
            ->select(
                'd.debtor_no',
                'd.name',
                'd.curr_code',
                // Total outstanding at date
                DB::raw("SUM(IFNULL(t.ov_amount + t.ov_gst + t.ov_freight + t.ov_freight_tax + t.ov_discount - t.alloc, 0)) as balance"),
                // Due (Balance where due_date <= $date)
                DB::raw("SUM(CASE WHEN t.due_date <= '$date' THEN IFNULL(t.ov_amount + t.ov_gst + t.ov_freight + t.ov_freight_tax + t.ov_discount - t.alloc, 0) ELSE 0 END) as due"),
                // Overdue 1 (Balance where (date - due_date) >= 30)
                DB::raw("SUM(CASE WHEN DATEDIFF('$date', t.due_date) >= $past_due_days THEN IFNULL(t.ov_amount + t.ov_gst + t.ov_freight + t.ov_freight_tax + t.ov_discount - t.alloc, 0) ELSE 0 END) as overdue1"),
                // Overdue 2 (Balance where (date - due_date) >= 60)
                DB::raw("SUM(CASE WHEN DATEDIFF('$date', t.due_date) >= $past_due_days2 THEN IFNULL(t.ov_amount + t.ov_gst + t.ov_freight + t.ov_freight_tax + t.ov_discount - t.alloc, 0) ELSE 0 END) as overdue2")
            )
            ->where(function($q) use ($date) {
                $q->where('t.tran_date', '<=', $date)
                  ->orWhereNull('t.tran_date');
            })
            ->groupBy('d.debtor_no', 'd.name', 'd.curr_code');

        if ($from_customer) $query->where('d.debtor_no', '>=', $from_customer);
        if ($to_customer) $query->where('d.debtor_no', '<=', $to_customer);
        if ($currency !== 'all') $query->where('d.curr_code', '=', $currency);

        return $query->get()->map(function ($row) {
            // Apply FA's subtraction logic for buckets
            $row->current = $row->balance - $row->due;
            $row->age1 = $row->due - $row->overdue1;
            $row->age2 = $row->overdue1 - $row->overdue2;
            $row->age3 = $row->overdue2;
            return $row;
        })->filter(function ($row) use ($show_all) {
            return $show_all || abs($row->balance) > 0.001;
        });
    }

    /**
     * Get data for Customer Trial Balance Report (Report ID: 115)
     */
    public function getCustomerTrialBalanceData(Request $request)
    {
        $startDate = $request->input('startDate', ActiveFiscalYear::defaultStart());
        $endDate = $request->input('endDate', now()->format('Y-m-d'));
        $from_customer = $request->input('from_customer');
        $to_customer = $request->input('to_customer');
        $currency = $request->input('currency', 'all');
        $suppressZeros = $request->input('suppressZeros', 'No') === 'Yes';

        // 1. Get all customers
        $customersQuery = DB::table('debtors_master as d')
            ->select('d.debtor_no', 'd.name', 'd.curr_code');

        if ($from_customer) $customersQuery->where('d.debtor_no', '>=', $from_customer);
        if ($to_customer) $customersQuery->where('d.debtor_no', '<=', $to_customer);
        if ($currency !== 'all') $customersQuery->where('d.curr_code', '=', $currency);

        $customers = $customersQuery->get();

        return $customers->map(function ($customer) use ($startDate, $endDate) {
            // A. Opening Balance (Total before StartDate)
            $opening = DB::table('debtor_trans')
                ->where('debtor_no', $customer->debtor_no)
                ->where('tran_date', '<', $startDate)
                ->sum(DB::raw("ov_amount + ov_gst + ov_freight + ov_freight_tax + ov_discount - alloc"));

            // B. Debits (New Invoices/Charges between Start and End)
            $debits = DB::table('debtor_trans')
                ->where('debtor_no', $customer->debtor_no)
                ->whereBetween('tran_date', [$startDate, $endDate])
                ->where(DB::raw("ov_amount + ov_gst + ov_freight + ov_freight_tax + ov_discount"), '>', 0)
                ->sum(DB::raw("ov_amount + ov_gst + ov_freight + ov_freight_tax + ov_discount"));

            // C. Credits (New Payments/Allocations between Start and End)
            // Note: In FA logic, credits are often negative amounts or specific trans types. 
            // Here we assume positive movement for debits and strictly sum the allocated/payments for credits in this period.
            $credits = DB::table('debtor_trans')
                ->where('debtor_no', $customer->debtor_no)
                ->whereBetween('tran_date', [$startDate, $endDate])
                ->where(DB::raw("ov_amount + ov_gst + ov_freight + ov_freight_tax + ov_discount"), '<', 0)
                ->sum(DB::raw("ABS(ov_amount + ov_gst + ov_freight + ov_freight_tax + ov_discount)"));
            
            // Additionally sum external allocations/payments if needed, but usually debtor_trans handles it.
            
            $customer->opening_balance = $opening;
            $customer->debits = $debits;
            $customer->credits = $credits;
            $customer->closing_balance = $opening + $debits - $credits;

            return $customer;
        })->filter(function ($row) use ($suppressZeros) {
            if ($suppressZeros) {
                return abs($row->opening_balance) > 0.001 || abs($row->debits) > 0.001 || abs($row->credits) > 0.001;
            }
            return true;
        });
    }

    /**
     * Get data for Customer Detail Listing Report (Report ID: 103)
     */
    public function getCustomerDetailListingData(Request $request)
    {
        $activitySince = $request->input('activitySince', ActiveFiscalYear::defaultStart());
        $salesArea = $request->input('salesArea', 'NoFilter');
        $salesFolk = $request->input('salesFolk', 'NoFilter');
        $greaterThan = (float)$request->input('greaterThan', 0);
        $lessThan = (float)$request->input('lessThan', 0);

        $query = DB::table('debtors_master as d')
            ->leftJoin('cust_branch as b', 'd.debtor_no', '=', 'b.debtor_no')
            ->select(
                'd.debtor_no',
                'd.name',
                'd.address',
                'd.curr_code',
                'b.br_name',
                'b.sales_area',
                'b.sales_person',
                DB::raw("(SELECT SUM(ov_amount + ov_gst + ov_freight + ov_freight_tax + ov_discount) 
                          FROM debtor_trans 
                          WHERE debtor_no = d.debtor_no 
                          AND tran_date >= '$activitySince') as turnover"),
                // Since contact info is in crm_persons via crm_contacts, we'll try to get representative info
                DB::raw("(SELECT p.name FROM crm_persons p 
                          JOIN crm_contacts c ON p.id = c.person_id 
                          WHERE c.entity_id = CAST(b.branch_code AS CHAR) AND c.action = 'cust_branch' LIMIT 1) as contact_name"),
                DB::raw("(SELECT p.phone FROM crm_persons p 
                          JOIN crm_contacts c ON p.id = c.person_id 
                          WHERE c.entity_id = CAST(b.branch_code AS CHAR) AND c.action = 'cust_branch' LIMIT 1) as phone"),
                DB::raw("(SELECT p.email FROM crm_persons p 
                          JOIN crm_contacts c ON p.id = c.person_id 
                          WHERE c.entity_id = CAST(b.branch_code AS CHAR) AND c.action = 'cust_branch' LIMIT 1) as email")
            );

        if ($salesArea !== 'NoFilter' && $salesArea !== '') {
            $query->where('b.sales_area', '=', $salesArea);
        }

        if ($salesFolk !== 'NoFilter' && $salesFolk !== '') {
            $query->where('b.sales_person', '=', $salesFolk);
        }

        $results = $query->get();

        return $results->filter(function ($customer) use ($greaterThan, $lessThan) {
            $turnover = (float)$customer->turnover;
            if ($greaterThan > 0 && $turnover <= $greaterThan) return false;
            if ($lessThan > 0 && $turnover >= $lessThan) return false;
            return true;
        });
    }

    /**
     * Get data for Sales Summary Report (Report ID: 114)
     */
    public function getSalesSummaryData(Request $request)
    {
        $startDate = $request->input('startDate', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('endDate', now()->format('Y-m-d'));
        $taxIdOnly = $request->input('taxIdOnly', 'No') === 'Yes';

        $query = DB::table('debtors_master as d')
            ->join('debtor_trans as t', 'd.debtor_no', '=', 't.debtor_no')
            ->select(
                'd.debtor_no',
                'd.name',
                'd.gst as tax_id',
                DB::raw("SUM(t.ov_amount + t.ov_freight + t.ov_discount) as net_amount"),
                DB::raw("SUM(t.ov_gst + t.ov_freight_tax) as tax_amount")
            )
            ->whereIn('t.trans_type', [10, 11]) // 10 = Invoice, 11 = Credit Note in FA
            ->whereBetween('t.tran_date', [$startDate, $endDate])
            ->groupBy('d.debtor_no', 'd.name', 'd.gst');

        if ($taxIdOnly) {
            $query->whereNotNull('d.gst')->where('d.gst', '!=', '');
        }

        return $query->get();
    }

    /**
     * Get data for Aged Supplier Analysis Report (Report ID: 202)
     */
    public function getAgedSupplierAnalysisData(Request $request)
    {
        $date = $request->input('endDate', now()->format('Y-m-d'));
        $fromSupplier = $request->input('from_supplier');
        $toSupplier = $request->input('to_supplier');
        $showAll = $request->input('showAll', 'No') === 'Yes';

        $pastDueDays = 30;
        $pastDueDays2 = 60;

        $query = DB::table('suppliers as s')
            ->leftJoin('supp_trans as t', 's.supplier_id', '=', 't.supplier_id')
            ->select(
                's.supplier_id',
                's.supp_name as name',
                's.curr_code',
                DB::raw('SUM(IFNULL(t.ov_amount + t.ov_gst - t.alloc, 0)) as balance'),
                DB::raw("SUM(CASE WHEN t.due_date <= '$date' THEN IFNULL(t.ov_amount + t.ov_gst - t.alloc, 0) ELSE 0 END) as due"),
                DB::raw("SUM(CASE WHEN DATEDIFF('$date', t.due_date) >= $pastDueDays THEN IFNULL(t.ov_amount + t.ov_gst - t.alloc, 0) ELSE 0 END) as overdue1"),
                DB::raw("SUM(CASE WHEN DATEDIFF('$date', t.due_date) >= $pastDueDays2 THEN IFNULL(t.ov_amount + t.ov_gst - t.alloc, 0) ELSE 0 END) as overdue2")
            )
            ->where(function ($q) use ($date) {
                $q->where('t.trans_date', '<=', $date)
                    ->orWhereNull('t.trans_date');
            })
            ->groupBy('s.supplier_id', 's.supp_name', 's.curr_code');

        if ($fromSupplier) {
            $query->where('s.supplier_id', '>=', $fromSupplier);
        }
        if ($toSupplier) {
            $query->where('s.supplier_id', '<=', $toSupplier);
        }

        return $query->get()->map(function ($row) {
            $row->current = $row->balance - $row->due;
            $row->age1 = $row->due - $row->overdue1;
            $row->age2 = $row->overdue1 - $row->overdue2;
            $row->age3 = $row->overdue2;

            return $row;
        })->filter(function ($row) use ($showAll) {
            return $showAll || abs($row->balance) > 0.001;
        });
    }
}

