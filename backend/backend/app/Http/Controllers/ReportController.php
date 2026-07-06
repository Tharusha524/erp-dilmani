<?php

namespace App\Http\Controllers;

use App\Repositories\All\Reports\ReportsInterface;
use App\Services\CompanyReportHeader;
use App\Services\Pdf\TcpdfGenerator;
use App\Services\Reports\ReportPdfBuilder;
use App\Support\ActiveFiscalYear;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    protected $reports;
    protected ReportPdfBuilder $pdfBuilder;
    protected TcpdfGenerator $pdf;

    public function __construct(ReportsInterface $reports, ReportPdfBuilder $pdfBuilder, TcpdfGenerator $pdf)
    {
        $this->reports = $reports;
        $this->pdfBuilder = $pdfBuilder;
        $this->pdf = $pdf;
    }

    /**
     * Unified PDF generation for all report types.
     */
    public function generate(Request $request)
    {
        try {
            $reportKey = $request->input('reportKey', 'generic');
            $payload = $this->pdfBuilder->build($reportKey, $request);

            $view = $payload['view'] ?? 'reports.generic';
            unset($payload['view']);

            $orientation = strtolower($request->input('orientation', 'portrait')) === 'landscape' ? 'L' : 'P';
            $filename = $reportKey . '_' . date('Y-m-d') . '.pdf';

            return $this->pdf->downloadFromView($view, $payload, $filename, $orientation);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to generate report PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function customerBalances(Request $request)
    {
        $data = $this->reports->getCustomerBalancesData($request);

        return $this->pdf->streamFromView('reports.customer_balances', [
            'data' => $data,
            'startDate' => $request->input('startDate', now()->format('Y-m-d')),
            'endDate' => $request->input('endDate', now()->format('Y-m-d')),
            'currency' => $request->input('currency', 'All'),
            'title' => 'Customer Balances Report',
            'companyHeader' => CompanyReportHeader::forReports(),
        ], 'customer_balances.pdf', 'P');
    }

    public function agedCustomerAnalysis(Request $request)
    {
        $data = $this->reports->getAgedCustomerAnalysisData($request);

        return $this->pdf->streamFromView('reports.aged_customer_analysis', [
            'data' => $data,
            'date' => $request->input('endDate', now()->format('Y-m-d')),
            'currency' => $request->input('currency', 'All'),
            'title' => 'Aged Customer Analysis',
            'companyHeader' => CompanyReportHeader::forReports(),
        ], 'aged_customer_analysis.pdf', 'P');
    }

    public function customerTrialBalance(Request $request)
    {
        $data = $this->reports->getCustomerTrialBalanceData($request);

        return $this->pdf->streamFromView('reports.customer_trial_balance', [
            'data' => $data,
            'startDate' => $request->input('startDate', ActiveFiscalYear::defaultStart()),
            'endDate' => $request->input('endDate', ActiveFiscalYear::defaultEnd()),
            'currency' => $request->input('currency', 'All'),
            'title' => 'Customer Trial Balance',
            'companyHeader' => CompanyReportHeader::forReports(),
        ], 'customer_trial_balance.pdf', 'P');
    }

    public function customerDetailListing(Request $request)
    {
        $data = $this->reports->getCustomerDetailListingData($request);

        return $this->pdf->streamFromView('reports.customer_detail_listing', [
            'data' => $data,
            'activitySince' => $request->input('activitySince', ActiveFiscalYear::defaultStart()),
            'title' => 'Customer Detail Listing',
            'companyHeader' => CompanyReportHeader::forReports(),
        ], 'customer_detail_listing.pdf', 'P');
    }

    public function salesSummary(Request $request)
    {
        $data = $this->reports->getSalesSummaryData($request);

        return $this->pdf->streamFromView('reports.sales_summary', [
            'data' => $data,
            'startDate' => $request->input('startDate', now()->startOfMonth()->format('Y-m-d')),
            'endDate' => $request->input('endDate', now()->format('Y-m-d')),
            'title' => 'Sales Summary Report',
            'companyHeader' => CompanyReportHeader::forReports(),
        ], 'sales_summary.pdf', 'P');
    }

    public function monthlySalesSummary(Request $request)
    {
        $year = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);

        $periodStart = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $periodEnd = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $mergedRequest = new Request(array_merge($request->all(), [
            'startDate' => $periodStart,
            'endDate' => $periodEnd,
        ]));

        $rows = $this->reports->getSalesSummaryData($mergedRequest);

        if ($request->boolean('downloadPdf', false)) {
            $payload = $this->pdfBuilder->build('sales-summary-report', $mergedRequest);
            $payload['title'] = "Monthly Sales Summary ({$year}-".str_pad((string) $month, 2, '0', STR_PAD_LEFT).")";
            $payload['subtitle'] = "{$periodStart} to {$periodEnd}";

            return $this->pdf->downloadFromView(
                'reports.generic',
                $payload,
                "monthly_sales_summary_{$year}_".str_pad((string) $month, 2, '0', STR_PAD_LEFT).'.pdf',
                'P'
            );
        }

        return response()->json([
            'month' => $month,
            'year' => $year,
            'startDate' => $periodStart,
            'endDate' => $periodEnd,
            'totalCustomers' => $rows->count(),
            'totals' => [
                'netAmount' => round((float) $rows->sum('net_amount'), 2),
                'taxAmount' => round((float) $rows->sum('tax_amount'), 2),
            ],
            'rows' => $rows,
        ]);
    }
}

