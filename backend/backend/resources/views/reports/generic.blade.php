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

    @if(!empty($parameters) && count($parameters))
        <table class="erp-params-table" border="1" cellpadding="0" cellspacing="0" width="100%">
            <tbody>
                @foreach($parameters as $label => $value)
                    <tr>
                        <th>{{ $label }}</th>
                        <td>{{ is_array($value) ? json_encode($value) : $value }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if(!empty($headers) && count($rows))
        <table class="erp-data-table" border="1" cellpadding="0" cellspacing="0" width="100%">
            <thead>
                <tr>
                    @foreach($headers as $header)
                        <th>{{ $header }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($rows as $index => $row)
                    <tr @if($index % 2 === 1) class="erp-row-alt" @endif>
                        @foreach($row as $cell)
                            <td>{{ $cell }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    @elseif(empty($parameters))
        <div class="erp-empty">No transaction data matched the selected criteria.</div>
    @endif
</body>
</html>
