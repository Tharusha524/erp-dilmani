<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
    @include('reports.partials.pdf_common_styles')
    <style>
        .customer-header { font-weight: bold; background-color: #f9f9f9; }
    </style>
</head>
<body>
    @include('reports.partials.report_header', [
        'companyHeader' => $companyHeader ?? [],
        'title' => $title,
        'subtitle' => 'Activity since: ' . ($activitySince ?? ''),
    ])

    <table class="erp-data-table" border="1" cellpadding="0" cellspacing="0" width="100%">
        <thead>
            <tr>
                <th>Cust # / Name</th>
                <th>Branch / Contact</th>
                <th>Phone / Email</th>
                <th class="text-right">Turnover</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $item)
                <tr class="total-row">
                    <td>{{ $item->debtor_no }} - {{ $item->name }}</td>
                    <td>{{ $item->br_name }}</td>
                    <td>{{ $item->phone }}</td>
                    <td class="text-right">{{ number_format($item->turnover, 2) }} {{ $item->curr_code }}</td>
                </tr>
                <tr>
                    <td colspan="2">Address: {{ $item->address }}</td>
                    <td>Contact: {{ $item->contact_name }}</td>
                    <td class="text-right">Email: {{ $item->email }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="erp-footer">
        Generated on {{ date('Y-m-d H:i:s') }}
    </div>
</body>
</html>
