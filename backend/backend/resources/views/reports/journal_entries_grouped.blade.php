<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
    @include('reports.partials.pdf_common_styles')
    <style>
        table.je-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            color: #000;
        }
        table.je-table th {
            font-style: italic;
            font-weight: normal;
            padding: 2px;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
        }
        table.je-table td {
            padding: 2px;
            vertical-align: top;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        
        .trans-header td {
            padding-top: 6px;
        }
        .trans-total td {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding-top: 4px;
            padding-bottom: 4px;
            margin-bottom: 4px;
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
        $fmt = fn ($n) => $n == 0 ? '' : number_format((float) $n, 2);
    @endphp

    @if(empty($grouped))
        <div class="erp-empty">No journal entries found for the selected criteria.</div>
    @else
        <table class="je-table" cellpadding="0" cellspacing="0" width="100%">
            <thead>
                <tr>
                    <th width="15%" class="text-left">Type/Account</th>
                    <th width="30%" class="text-left">Reference/Account Name</th>
                    <th width="10%" class="text-left">Date/Dim.</th>
                    <th width="25%" class="text-left">Person/Item/Memo</th>
                    <th width="10%" class="text-right">Debit</th>
                    <th width="10%" class="text-right">Credit</th>
                </tr>
            </thead>
            <tbody>
                @foreach($grouped as $group)
                    @php 
                        $h = $group['header'];
                        $firstDetail = collect($group['details'])->first();
                        $typeName = $firstDetail->type_label ?? $h->trans_type;
                    @endphp
                    <tr class="trans-header">
                        <td>{{ $typeName }} # {{ $h->trans_no }}</td>
                        <td>{{ $h->reference }}</td>
                        <td>{{ $h->tran_date ? date('d/m/Y', strtotime($h->tran_date)) : '' }}</td>
                        <td>{{ $h->memo }}</td>
                        <td></td>
                        <td></td>
                    </tr>
                    
                    @foreach($group['details'] as $d)
                        <tr>
                            <td>{{ $d->account_code ?? '' }}</td>
                            <td>{{ $d->account_name ?? '' }}</td>
                            <td></td>
                            <td>{{ $d->memo ?? '' }}</td>
                            <td class="text-right">{{ $fmt($d->debit ?? 0) }}</td>
                            <td class="text-right">{{ $fmt($d->credit ?? 0) }}</td>
                        </tr>
                    @endforeach
                    
                    <tr class="trans-total">
                        <td colspan="4"></td>
                        <td class="text-right">{{ number_format($group['total_debit'], 2) }}</td>
                        <td class="text-right">{{ number_format($group['total_credit'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif
</body>
</html>
