<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
    @include('reports.partials.pdf_common_styles')
</head>
<body>
    @include('reports.partials.report_header', [
        'companyHeader' => $companyHeader ?? [],
        'title' => $title ?? 'Customer Balances Report',
        'subtitle' => 'As at: ' . ($endDate ?? date('Y-m-d')),
    ])

    <table class="erp-data-table" border="1" cellpadding="0" cellspacing="0" width="100%">
        <thead>
            <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Currency</th>
                <th class="text-right">Opening Balance</th>
                <th class="text-right">Charges</th>
                <th class="text-right">Credits</th>
                <th class="text-right">Balance</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $index => $item)
                <tr @if($index % 2 === 1) class="erp-row-alt" @endif>
                    <td>{{ $item->debtor_no }}</td>
                    <td>{{ $item->name }}</td>
                    <td>{{ $item->curr_code }}</td>
                    <td class="text-right">{{ number_format($item->opening_balance, 2) }}</td>
                    <td class="text-right">{{ number_format($item->charges, 2) }}</td>
                    <td class="text-right">{{ number_format($item->credits, 2) }}</td>
                    <td class="text-right">{{ number_format($item->balance, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="erp-footer">Generated on {{ date('Y-m-d H:i:s') }}</div>
</body>
</html>
