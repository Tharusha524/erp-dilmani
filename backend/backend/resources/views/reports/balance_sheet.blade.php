<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
    @include('reports.partials.pdf_common_styles')
    <style>
        table.bs-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            color: #000;
        }
        table.bs-table th {
            font-style: italic;
            font-weight: normal;
            padding: 2px;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
        }
        table.bs-table td {
            padding: 2px;
            vertical-align: top;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
    </style>
</head>
<body>
    @include('reports.partials.report_header', [
        'companyHeader' => $companyHeader ?? [],
        'title' => $title,
        'subtitle' => $subtitle ?? null,
    ])

    @php
        $fmt = fn ($n) => $n == 0 ? '0' : number_format((float) $n, 2);
        $closing = $totals['closing'] ?? [];
        $opening = $totals['opening'] ?? [];
        $period = $totals['period'] ?? [];
        $balanced = !empty($closing['equation_balanced']);
    @endphp

    @if(empty($grouped))
        <div class="erp-empty">No balance sheet accounts with activity for the selected period.</div>
    @else
        <table class="bs-table" cellpadding="0" cellspacing="0" width="100%">
            <thead>
                <tr>
                    <th width="15%" class="text-left">Account</th>
                    <th width="37%" class="text-left">Account Name</th>
                    <th class="text-right" width="16%">Open Balance</th>
                    <th class="text-right" width="16%">Period</th>
                    <th class="text-right" width="16%">Close Balance</th>
                </tr>
            </thead>
            <tbody>
                @foreach($grouped as $className => $typeGroups)
                    @php
                        $classOpening = 0;
                        $classPeriod = 0;
                        $classClosing = 0;
                    @endphp
                    
                    <tr>
                        <td colspan="5" style="font-weight: bold; text-transform: uppercase; padding-top: 8px; padding-bottom: 4px;">{{ $className }}</td>
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
                        <tr>
                            <td colspan="5" style="text-transform: uppercase; padding-top: 4px; padding-bottom: 4px;">{{ $typeName }}</td>
                        </tr>
                        @foreach($accounts as $row)
                            @php
                                $grpOpening += (float) ($row['opening'] ?? 0);
                                $grpPeriod += (float) ($row['period'] ?? 0);
                                $grpClosing += (float) ($row['closing'] ?? 0);
                            @endphp
                            <tr>
                                <td>{{ $row['code'] ?? '' }}</td>
                                <td>{{ $row['description'] ?? '' }}</td>
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
                        
                        <tr>
                            <td colspan="5" style="border-top: 1px solid #000; height: 1px; padding: 0;"></td>
                        </tr>
                        <tr>
                            <td colspan="2">Total {{ strtoupper($typeName) }}</td>
                            <td class="text-right">{{ $fmt($grpOpening) }}</td>
                            <td class="text-right">{{ $fmt($grpPeriod) }}</td>
                            <td class="text-right">{{ $fmt($grpClosing) }}</td>
                        </tr>
                    @endforeach

                    <tr>
                        <td colspan="5" style="border-top: 1px solid #000; height: 1px; padding: 0;"></td>
                    </tr>
                    <tr>
                        <td colspan="2"><strong>Total {{ strtoupper($className) }}</strong></td>
                        <td class="text-right"><strong>{{ $fmt($classOpening) }}</strong></td>
                        <td class="text-right"><strong>{{ $fmt($classPeriod) }}</strong></td>
                        <td class="text-right"><strong>{{ $fmt($classClosing) }}</strong></td>
                    </tr>
                @endforeach

                <tr>
                    <td colspan="5" style="padding-top: 15px;"></td>
                </tr>
                <tr>
                    <td colspan="2"><strong>Total LIABILITIES</strong></td>
                    <td class="text-right"><strong>{{ $fmt($opening['liabilities_plus_equity'] ?? 0) }}</strong></td>
                    <td class="text-right"><strong>{{ $fmt($period['liabilities_plus_equity'] ?? 0) }}</strong></td>
                    <td class="text-right"><strong>{{ $fmt($closing['liabilities_plus_equity'] ?? 0) }}</strong></td>
                </tr>
                <tr>
                    <td colspan="5" style="padding-top: 15px;"></td>
                </tr>
                <tr>
                    <td colspan="2">Calculated Return</td>
                    <td class="text-right">0</td>
                    <td class="text-right">0</td>
                    <td class="text-right">0</td>
                </tr>
                <tr>
                    <td colspan="5" style="padding-top: 15px;"></td>
                </tr>
                <tr>
                    <td colspan="2"><strong>Total Liabilities and Equities</strong></td>
                    <td class="text-right"><strong>{{ $fmt($opening['liabilities_plus_equity'] ?? 0) }}</strong></td>
                    <td class="text-right"><strong>{{ $fmt($period['liabilities_plus_equity'] ?? 0) }}</strong></td>
                    <td class="text-right"><strong>{{ $fmt($closing['liabilities_plus_equity'] ?? 0) }}</strong></td>
                </tr>
                <tr>
                    <td colspan="5" style="border-top: 1px solid #000; height: 1px; padding: 0; margin-bottom: 10px;"></td>
                </tr>
            </tbody>
        </table>
    @endif
</body>
</html>
