<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
    @include('reports.partials.pdf_common_styles')
    <style>
        table.erp-data-table { table-layout: fixed; }
        table.erp-data-table th, table.erp-data-table td { word-wrap: break-word; }
    </style>
</head>
<body>
    @include('reports.partials.report_header', [
        'companyHeader' => $companyHeader ?? [],
        'title' => $title,
        'subtitle' => 'As at: ' . ($date ?? '') . ' | Currency: ' . ($currency ?? 'All'),
    ])

    <table class="erp-data-table" border="1" cellpadding="0" cellspacing="0" width="100%">
        <thead>
            <tr>
                <th style="width: 15%;">Cust No</th>
                <th style="width: 25%;">Customer Name</th>
                <th class="text-right">Current</th>
                <th class="text-right">1-30 Days</th>
                <th class="text-right">31-60 Days</th>
                <th class="text-right">Over 60 Days</th>
                <th class="text-right">Total Balance</th>
            </tr>
        </thead>
        <tbody>
            @php 
                $total_bal = 0; $total_curr = 0; $total_age1 = 0; $total_age2 = 0; $total_age3 = 0;
            @endphp
            @foreach($data as $index => $item)
                <tr @if($index % 2 === 1) class="erp-row-alt" @endif>
                    <td>{{ $item->debtor_no }}</td>
                    <td>{{ $item->name }}</td>
                    <td class="text-right">{{ number_format($item->current, 2) }}</td>
                    <td class="text-right">{{ number_format($item->age1, 2) }}</td>
                    <td class="text-right">{{ number_format($item->age2, 2) }}</td>
                    <td class="text-right">{{ number_format($item->age3, 2) }}</td>
                    <td class="text-right">{{ number_format($item->balance, 2) }}</td>
                </tr>
                @php
                    $total_bal += $item->balance;
                    $total_curr += $item->current;
                    $total_age1 += $item->age1;
                    $total_age2 += $item->age2;
                    $total_age3 += $item->age3;
                @endphp
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="2">Grand Totals</td>
                <td class="text-right">{{ number_format($total_curr, 2) }}</td>
                <td class="text-right">{{ number_format($total_age1, 2) }}</td>
                <td class="text-right">{{ number_format($total_age2, 2) }}</td>
                <td class="text-right">{{ number_format($total_age3, 2) }}</td>
                <td class="text-right">{{ number_format($total_bal, 2) }}</td>
            </tr>
        </tfoot>
    </table>

    <div class="erp-footer">
        Generated on {{ date('Y-m-d H:i:s') }}
    </div>
</body>
</html>
