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
        table.erp-data-table th.text-right,
        table.erp-data-table td.text-right {
            text-align: right;
        }
        table.erp-data-table td.account-code { width: 12%; white-space: nowrap; }
        table.erp-data-table td.account-name { width: 34%; }
        table.erp-data-table tr.erp-summary-row td {
            background: #e8eaf6;
            font-weight: bold;
            border-top: 2px solid #333;
        }
        table.erp-data-table tr.erp-net-row td {
            background: #e8f5e9;
            font-weight: bold;
            border-top: 3px solid #1b5e20;
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
        $achieve = function (float $period, float $compare) {
            if (abs($compare) < 0.001) return '999.0';
            return number_format(($period / $compare) * 100, 1, '.', ',');
        };
        $fy = $fiscalYear ?? [];
        $compareLabel = $compareLabel ?? 'Accumulated';
        $statement = $statement ?? [];
        $sections = $statement['sections'] ?? [];
        $summary = $statement['summary'] ?? [];
        $netProfit = $summary['netProfit'] ?? ['period' => 0, 'compare' => 0, 'achievePercent' => '999.0'];
        $summaryOnlyKeys = ['gross_profit', 'total_income'];
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

    @if(empty($sections))
        <div class="erp-empty">No profit and loss activity for the selected period.</div>
    @else
        <table class="erp-data-table" border="1" cellpadding="0" cellspacing="0" width="100%">
            <thead>
                <tr>
                    <th class="account-code">Account</th>
                    <th class="account-name">Account Name</th>
                    <th class="text-right" width="16%">Period</th>
                    <th class="text-right" width="16%">{{ $compareLabel }}</th>
                    <th class="text-right" width="12%">Achieved %</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sections as $section)
                    @php
                        $sectionKey = $section['key'] ?? '';
                        $isSummaryOnly = in_array($sectionKey, $summaryOnlyKeys, true)
                            || (empty($section['lines']) && !empty($section['subtotals']));
                    @endphp

                    @if(!$isSummaryOnly)
                        <tr class="erp-section-row">
                            <td colspan="5">{{ strtoupper($section['title'] ?? '') }}</td>
                        </tr>
                    @endif

                    @foreach($section['lines'] ?? [] as $line)
                        @php $kind = $line['kind'] ?? 'account'; @endphp
                        @if($kind === 'group')
                            <tr class="erp-group-row"><td colspan="5">{{ $line['label'] ?? '' }}</td></tr>
                        @elseif($kind === 'account')
                            <tr>
                                <td class="account-code">{{ $line['account_code'] ?? '' }}</td>
                                <td class="account-name">{{ $line['label'] ?? '' }}</td>
                                <td class="text-right">{{ $fmt($line['period'] ?? 0) }}</td>
                                <td class="text-right">{{ $fmt($line['compareValue'] ?? 0) }}</td>
                                <td class="text-right">{{ $line['achievePercent'] ?? $achieve((float) ($line['period'] ?? 0), (float) ($line['compareValue'] ?? 0)) }}</td>
                            </tr>
                        @elseif($kind === 'calculated')
                            <tr>
                                <td class="account-code"></td>
                                <td class="account-name" style="font-style: italic;">{{ $line['label'] ?? '' }}</td>
                                <td class="text-right">{{ $fmt($line['period'] ?? 0) }}</td>
                                <td class="text-right">{{ $fmt($line['compareValue'] ?? 0) }}</td>
                                <td class="text-right">{{ $line['achievePercent'] ?? $achieve((float) ($line['period'] ?? 0), (float) ($line['compareValue'] ?? 0)) }}</td>
                            </tr>
                        @elseif($kind === 'subtotal')
                            <tr class="erp-subtotal-row">
                                <td colspan="2">{{ $line['label'] ?? '' }}</td>
                                <td class="text-right">{{ $fmt($line['period'] ?? 0) }}</td>
                                <td class="text-right">{{ $fmt($line['compareValue'] ?? 0) }}</td>
                                <td class="text-right">{{ $line['achievePercent'] ?? $achieve((float) ($line['period'] ?? 0), (float) ($line['compareValue'] ?? 0)) }}</td>
                            </tr>
                        @endif
                    @endforeach

                    @foreach($section['subtotals'] ?? [] as $subtotal)
                        @php $bold = !empty($subtotal['bold']) || $isSummaryOnly; @endphp
                        <tr class="{{ $bold ? 'erp-summary-row' : 'erp-subtotal-row' }}">
                            <td colspan="2" @if($bold) style="font-weight:bold;" @endif>{{ $subtotal['label'] ?? '' }}</td>
                            <td class="text-right" @if($bold) style="font-weight:bold;" @endif>{{ $fmt($subtotal['period'] ?? 0) }}</td>
                            <td class="text-right" @if($bold) style="font-weight:bold;" @endif>{{ $fmt($subtotal['compareValue'] ?? 0) }}</td>
                            <td class="text-right" @if($bold) style="font-weight:bold;" @endif>{{ $subtotal['achievePercent'] ?? $achieve((float) ($subtotal['period'] ?? 0), (float) ($subtotal['compareValue'] ?? 0)) }}</td>
                        </tr>
                    @endforeach
                @endforeach

                <tr class="erp-net-row">
                    <td colspan="2">Net Profit / (Loss)</td>
                    <td class="text-right">{{ $fmt($netProfit['period'] ?? 0) }}</td>
                    <td class="text-right">{{ $fmt($netProfit['compare'] ?? 0) }}</td>
                    <td class="text-right">{{ $netProfit['achievePercent'] ?? $achieve((float) ($netProfit['period'] ?? 0), (float) ($netProfit['compare'] ?? 0)) }}</td>
                </tr>
            </tbody>
        </table>
    @endif

    <div class="erp-footer">Profit and Loss Statement</div>
</body>
</html>
