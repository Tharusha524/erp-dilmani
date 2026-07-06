<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
    @include('reports.partials.pdf_common_styles')
    <style>
        .total-row { font-weight: bold; background-color: #eee; }
    </style>
</head>
<body>
    @include('reports.partials.report_header', [
        'companyHeader' => $companyHeader ?? [],
        'title' => $title,
        'subtitle' => 'Period: ' . ($startDate ?? '') . ' to ' . ($endDate ?? ''),
    ])

    @php
        $suppressTax = !empty($companyHeader['suppress_tax_rates_on_docs']);
    @endphp
    <table class="erp-data-table" border="1" cellpadding="0" cellspacing="0" width="100%">
        <thead>
            <tr>
                <th>Customer</th>
                @unless($suppressTax)
                <th>Tax ID</th>
                <th class="text-right">Total Tax</th>
                @endunless
                <th class="text-right">{{ $suppressTax ? 'Total Amount' : 'Total Net (Ex. Tax)' }}</th>
                @unless($suppressTax)
                <th class="text-right">Total Inc. Tax</th>
                @endunless
            </tr>
        </thead>
        <tbody>
            @php 
                $total_net = 0; $total_tax = 0; $total_grand = 0;
            @endphp
            @foreach($data as $index => $item)
                <tr @if($index % 2 === 1) class="erp-row-alt" @endif>
                    <td>{{ $item->name }}</td>
                    @unless($suppressTax)
                    <td>{{ $item->tax_id ?? 'N/A' }}</td>
                    <td class="text-right">{{ number_format($item->tax_amount, 2) }}</td>
                    @endunless
                    <td class="text-right">{{ number_format($item->net_amount, 2) }}</td>
                    @unless($suppressTax)
                    <td class="text-right">{{ number_format($item->net_amount + $item->tax_amount, 2) }}</td>
                    @endunless
                </tr>
                @php
                    $total_net += $item->net_amount;
                    $total_tax += $item->tax_amount;
                    $total_grand += ($item->net_amount + $item->tax_amount);
                @endphp
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="{{ $suppressTax ? 1 : 2 }}">Grand Totals</td>
                @unless($suppressTax)
                <td class="text-right">{{ number_format($total_tax, 2) }}</td>
                @endunless
                <td class="text-right">{{ number_format($total_net, 2) }}</td>
                @unless($suppressTax)
                <td class="text-right">{{ number_format($total_grand, 2) }}</td>
                @endunless
            </tr>
        </tfoot>
    </table>

    <div class="erp-footer">
        Generated {{ $companyHeader['report_generated_at'] ?? now()->format('d/m/Y H:i') }}
    </div>
</body>
</html>
