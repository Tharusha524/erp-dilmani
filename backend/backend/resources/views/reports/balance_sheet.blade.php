<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
    @include('reports.partials.pdf_common_styles')
</head>
<body>
    @include('reports.partials.report_header', [
        'companyHeader' => $companyHeader ?? [],
        'title' => $title,
        'subtitle' => $subtitle ?? null,
    ])

    @php
        $fmt = fn ($n) => number_format((float) $n, 2);
        $closing = $totals['closing'] ?? [];
        $opening = $totals['opening'] ?? [];
        $period = $totals['period'] ?? [];
        $balanced = !empty($closing['equation_balanced']);
    @endphp

    @if(empty($grouped))
        <div class="erp-empty">No balance sheet accounts with activity for the selected period.</div>
    @else
        <table class="erp-data-table" border="1" cellpadding="0" cellspacing="0" width="100%">
            <thead>
                <tr>
                    <th width="46%">Account</th>
                    <th class="text-right" width="18%">Opening</th>
                    <th class="text-right" width="18%">Period</th>
                    <th class="text-right" width="18%">Closing</th>
                </tr>
            </thead>
            <tbody>
                @foreach($grouped as $className => $typeGroups)
                    @php
                        $classOpening = 0;
                        $classPeriod = 0;
                        $classClosing = 0;
                        $classId = $typeGroups['_meta']['classId'] ?? '';
                    @endphp
                    <tr class="erp-section-row">
                        <td colspan="4">Class {{ $classId ?: '?' }} — {{ $className }}</td>
                    </tr>

                    @foreach($typeGroups as $typeName => $accounts)
                        @if($typeName === '_meta')
                            @continue
                        @endif
                        @php
                            $grpOpening = 0;
                            $grpPeriod = 0;
                            $grpClosing = 0;
                        @endphp
                        <tr class="erp-group-row">
                            <td colspan="4">{{ $typeName }}</td>
                        </tr>
                        @foreach($accounts as $row)
                            @php
                                $grpOpening += (float) ($row['opening'] ?? 0);
                                $grpPeriod += (float) ($row['period'] ?? 0);
                                $grpClosing += (float) ($row['closing'] ?? 0);
                                $isCalcReturn = !empty($row['is_calculated_return']);
                            @endphp
                            <tr class="{{ $isCalcReturn ? 'erp-calculated-return-row' : '' }}">
                                <td class="pl-18">
                                    {{ $row['description'] ?? '' }}
                                    @if(!empty($row['code']))
                                        ({{ $row['code'] }})
                                    @endif
                                </td>
                                <td class="text-right">{{ $fmt($row['opening'] ?? 0) }}</td>
                                <td class="text-right">{{ $fmt($row['period'] ?? 0) }}</td>
                                <td class="text-right">{{ $fmt($row['closing'] ?? 0) }}</td>
                            </tr>
                        @endforeach
                        @php
                            $classOpening += $grpOpening;
                            $classPeriod += $grpPeriod;
                            $classClosing += $grpClosing;
                        @endphp
                        <tr class="erp-subtotal-row">
                            <td class="pl-12">Subtotal — {{ $typeName }}</td>
                            <td class="text-right">{{ $fmt($grpOpening) }}</td>
                            <td class="text-right">{{ $fmt($grpPeriod) }}</td>
                            <td class="text-right">{{ $fmt($grpClosing) }}</td>
                        </tr>
                    @endforeach

                    <tr class="erp-subtotal-row">
                        <td><strong>Class {{ $classId ?: '?' }} Total — {{ $className }}</strong></td>
                        <td class="text-right"><strong>{{ $fmt($classOpening) }}</strong></td>
                        <td class="text-right"><strong>{{ $fmt($classPeriod) }}</strong></td>
                        <td class="text-right"><strong>{{ $fmt($classClosing) }}</strong></td>
                    </tr>
                @endforeach

                <tr class="erp-grand-row">
                    <td>Total Assets</td>
                    <td class="text-right">{{ $fmt($opening['total_assets'] ?? 0) }}</td>
                    <td class="text-right">{{ $fmt($period['total_assets'] ?? 0) }}</td>
                    <td class="text-right">{{ $fmt($closing['total_assets'] ?? 0) }}</td>
                </tr>
                <tr class="erp-grand-row">
                    <td>Total Liabilities</td>
                    <td class="text-right">{{ $fmt($opening['total_liabilities'] ?? 0) }}</td>
                    <td class="text-right">{{ $fmt($period['total_liabilities'] ?? 0) }}</td>
                    <td class="text-right">{{ $fmt($closing['total_liabilities'] ?? 0) }}</td>
                </tr>
                <tr class="erp-grand-row">
                    <td>Total Equity</td>
                    <td class="text-right">{{ $fmt($opening['total_equity'] ?? 0) }}</td>
                    <td class="text-right">{{ $fmt($period['total_equity'] ?? 0) }}</td>
                    <td class="text-right">{{ $fmt($closing['total_equity'] ?? 0) }}</td>
                </tr>
                <tr class="erp-grand-row">
                    <td>Total Liabilities + Equity</td>
                    <td class="text-right">{{ $fmt($opening['liabilities_plus_equity'] ?? 0) }}</td>
                    <td class="text-right">{{ $fmt($period['liabilities_plus_equity'] ?? 0) }}</td>
                    <td class="text-right">{{ $fmt($closing['liabilities_plus_equity'] ?? 0) }}</td>
                </tr>
                <tr class="erp-equation-row {{ $balanced ? '' : 'erp-unbalanced' }}">
                    <td colspan="4" class="text-center">
                        Assets {{ $fmt($closing['total_assets'] ?? 0) }}
                        {{ $balanced ? '=' : '≠' }}
                        Liabilities + Equity {{ $fmt($closing['liabilities_plus_equity'] ?? 0) }}
                        @if(!$balanced)
                            (Difference: {{ $fmt(abs(($closing['total_assets'] ?? 0) - ($closing['liabilities_plus_equity'] ?? 0))) }})
                        @endif
                    </td>
                </tr>
            </tbody>
        </table>
    @endif

    <div class="erp-footer">Statement of Financial Position</div>
</body>
</html>
