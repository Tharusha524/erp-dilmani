<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
    @include('reports.partials.pdf_common_styles')
    <style>
        .erp-fy-banner {
            font-size: 8px;
            color: #334155;
            margin: 0 0 6px 0;
            padding: 4px 6px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
        }
        table.erp-pl-table { border-collapse: collapse; }
        table.erp-pl-table td {
            padding: 4px 6px;
            border: none;
        }
        table.erp-pl-table td.pl-amount { text-align: right; white-space: nowrap; width: 18%; }
        table.erp-pl-table td.pl-amount-sub { text-align: right; white-space: nowrap; width: 18%; }
        table.erp-pl-table tr.pl-spacer td { padding: 2px 0; }
        table.erp-pl-table tr.pl-heading td { font-weight: bold; }
        table.erp-pl-table tr.pl-line td.pl-label { padding-left: 18px; }
        table.erp-pl-table tr.pl-total td {
            font-weight: bold;
            border-top: 1px solid #333;
        }
        table.erp-pl-table tr.pl-gross-profit td {
            font-weight: bold;
            border: 2px solid #1b5e20;
            background: #e8f5e9;
        }
        table.erp-pl-table tr.pl-net-profit td {
            font-weight: bold;
            border-top: 3px solid #1b5e20;
            background: #e8f5e9;
        }
    </style>
</head>
<body>
    @include('reports.partials.report_header', [
        'companyHeader' => $companyHeader ?? [],
        'title' => $title,
        'subtitle' => $subtitle ?? null,
    ])

    @php
        $fmt = fn ($n) => number_format((float) $n, 0, '.', ',');
        $fmtParen = fn ($n) => abs((float) $n) < 0.005 ? $fmt(0) : '(' . $fmt(abs((float) $n)) . ')';
        $fy = $fiscalYear ?? [];
        $summary = $statement['summary'] ?? [];
        $val = fn (string $key) => (float) ($summary[$key]['period'] ?? 0);
        $expenseCategories = $summary['expenseCategories'] ?? [];
        $catVal = fn (string $key) => (float) ($expenseCategories[$key]['period'] ?? 0);
    @endphp

    @if(!empty($fy['from_display']) && !empty($fy['to_display']))
        <div class="erp-fy-banner">
            <strong>Fiscal Year:</strong> {{ $fy['from_display'] }} - {{ $fy['to_display'] }}
            @if(!empty($fy['active'])) (Active) @endif
            @if(!empty($periodDisplay))
                &nbsp;&nbsp;|&nbsp;&nbsp;<strong>Period:</strong> {{ $periodDisplay }}
            @endif
        </div>
    @endif

    <table class="erp-pl-table" width="100%" cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th width="78%"></th>
                <th class="pl-amount" width="22%"></th>
            </tr>
        </thead>
        <tbody>
        <tr class="pl-heading">
            <td class="pl-label">Sales Revenue</td>
            <td class="pl-amount">{{ $fmt($val('sales')) }}</td>
        </tr>

        <tr class="pl-spacer"><td colspan="2">&nbsp;</td></tr>

        <tr class="pl-heading">
            <td class="pl-label">Less: Cost of Sales</td>
            <td class="pl-amount">&nbsp;</td>
        </tr>
        <tr class="pl-line">
            <td class="pl-label">Opening Stock</td>
            <td class="pl-amount-sub">{{ $fmt($val('openingStock')) }}</td>
        </tr>
        <tr class="pl-line">
            <td class="pl-label">Add: Purchases</td>
            <td class="pl-amount-sub">{{ $fmt($val('purchases')) }}</td>
        </tr>
        <tr class="pl-line">
            <td class="pl-label">Less: Closing Stock</td>
            <td class="pl-amount-sub">{{ $fmtParen($val('closingStock')) }}</td>
        </tr>
        <tr class="pl-total">
            <td class="pl-label">Total Cost of Sales</td>
            <td class="pl-amount">{{ $fmtParen($val('costOfSales')) }}</td>
        </tr>

        <tr class="pl-spacer"><td colspan="2">&nbsp;</td></tr>

        <tr class="pl-gross-profit">
            <td class="pl-label">Gross Profit</td>
            <td class="pl-amount">{{ $fmt($val('grossProfit')) }}</td>
        </tr>
        <tr class="pl-line">
            <td class="pl-label">Add: Other Income</td>
            <td class="pl-amount-sub">{{ $fmt($val('otherIncome')) }}</td>
        </tr>
        <tr class="pl-total">
            <td class="pl-label">Total Income</td>
            <td class="pl-amount">{{ $fmt($val('totalIncome')) }}</td>
        </tr>

        <tr class="pl-spacer"><td colspan="2">&nbsp;</td></tr>

        <tr class="pl-heading">
            <td class="pl-label">Less: Expenses</td>
            <td class="pl-amount">&nbsp;</td>
        </tr>
        <tr class="pl-line">
            <td class="pl-label">Distribution Expenses</td>
            <td class="pl-amount-sub">{{ $fmt($catVal('sales_distribution')) }}</td>
        </tr>
        <tr class="pl-line">
            <td class="pl-label">General &amp; Administrative Expenses</td>
            <td class="pl-amount-sub">{{ $fmt($catVal('general_administrative')) }}</td>
        </tr>
        <tr class="pl-line">
            <td class="pl-label">Finance Expenses</td>
            <td class="pl-amount-sub">{{ $fmt($catVal('finance')) }}</td>
        </tr>
        <tr class="pl-line">
            <td class="pl-label">Other Expenses</td>
            <td class="pl-amount-sub">{{ $fmt($catVal('other_cost')) }}</td>
        </tr>
        <tr class="pl-total">
            <td class="pl-label">Total Operating Expenses</td>
            <td class="pl-amount">{{ $fmtParen($val('totalExpenses')) }}</td>
        </tr>

        <tr class="pl-spacer"><td colspan="2">&nbsp;</td></tr>

        <tr class="pl-net-profit">
            <td class="pl-label">Net Profit</td>
            <td class="pl-amount">{{ $fmt($val('netProfit')) }}</td>
        </tr>
        </tbody>
    </table>

    <div class="erp-footer">Profit and Loss Statement</div>
</body>
</html>
