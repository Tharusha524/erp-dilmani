<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
    @include('reports.partials.pdf_common_styles')
    <style>
        .inv-page {
            margin-bottom: 10px;
        }
        table.inv-header {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        table.inv-header td {
            border: none;
            padding: 0;
            vertical-align: top;
        }
        .inv-logo img {
            width: 50px;
            height: auto;
        }
        .inv-company-name {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
        }
        .inv-company-meta {
            font-size: 8px;
            color: #475569;
            line-height: 1.4;
        }
        .inv-title {
            text-align: right;
            font-size: 20px;
            font-weight: bold;
            color: #94a3b8;
            letter-spacing: 1px;
        }
        table.inv-title-meta {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
        }
        table.inv-title-meta td {
            border: none;
            padding: 1px 0;
            font-size: 8px;
        }
        table.inv-title-meta td.inv-label {
            color: #64748b;
            text-align: right;
            padding-right: 6px;
            width: 60%;
        }
        table.inv-title-meta td.inv-value {
            text-align: right;
            font-weight: bold;
            color: #0f172a;
        }
        hr.inv-rule {
            border: none;
            border-top: 1px solid #cbd5e1;
            margin: 6px 0 8px 0;
        }
        table.inv-parties {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        table.inv-parties td {
            border: none;
            padding: 0 6px 8px 6px;
            vertical-align: top;
            width: 50%;
            font-size: 8px;
            line-height: 1.5;
        }
        .inv-party-label {
            font-weight: bold;
            color: #0f172a;
            font-size: 8px;
            margin-bottom: 2px;
        }
        table.inv-meta-row {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }
        table.inv-meta-row th {
            background-color: #f1f5f9;
            font-size: 7.5px;
            font-weight: bold;
            color: #334155;
            padding: 3px 5px;
            border: 1px solid #cbd5e1;
            text-align: left;
        }
        table.inv-meta-row td {
            font-size: 8px;
            padding: 3px 5px;
            border: 1px solid #cbd5e1;
        }
        .inv-terms {
            font-size: 8px;
            color: #334155;
            margin-bottom: 6px;
        }
        table.inv-items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }
        table.inv-items th {
            background-color: #0b1f44;
            color: #ffffff;
            font-size: 8px;
            font-weight: bold;
            padding: 4px 5px;
            border: 1px solid #0b1f44;
            text-align: left;
        }
        table.inv-items td {
            font-size: 8px;
            padding: 3px 5px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
        }
        table.inv-items tr.inv-totals-row td.inv-totals-label {
            border-top: none;
            border-bottom: none;
            border-left: none;
            text-align: right;
            padding-right: 8px;
        }
        table.inv-items tr.inv-totals-row td.inv-totals-value {
            text-align: right;
        }
        table.inv-items tr.inv-grand td {
            font-weight: bold;
            font-size: 9px;
            border-top: 1px solid #0f172a;
        }
        table.inv-items tr.inv-grand td.inv-totals-label {
            border-top: 1px solid #0f172a;
        }
        .inv-footer {
            font-size: 7.5px;
            color: #475569;
            text-align: center;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    @php
        $company = $companyHeader ?? [];
        // Strips stray leading/trailing spaces per line so address lines
        // align flush-left — TCPDF renders leading whitespace literally
        // instead of collapsing it the way a browser would.
        $cleanAddress = function (?string $text): string {
            if (!$text) {
                return '';
            }
            $lines = array_map('trim', explode("\n", str_replace("\r\n", "\n", $text)));
            return implode("\n", array_filter($lines, fn ($l) => $l !== ''));
        };
    @endphp

    @if(empty($invoices))
        <div class="erp-empty">No invoices found for the selected filters.</div>
    @endif

    @foreach($invoices as $index => $inv)
        @if($index > 0)
            <pagebreak />
        @endif
        <div class="inv-page">
            <table class="inv-header" cellpadding="0" cellspacing="0">
                <tr>
                    @if(!empty($company['show_logo']) && !empty($company['logo_path']))
                        <td class="inv-logo" width="60">
                            <img src="{{ $company['logo_path'] }}" alt="" />
                        </td>
                    @endif
                    <td>
                        <div class="inv-company-name">{{ $company['name'] ?? '' }}</div>
                        <div class="inv-company-meta">
                            @if(!empty($company['address'])){!! nl2br(e($cleanAddress($company['address']))) !!}<br>@endif
                            @if(!empty($company['domicile'])){{ $company['domicile'] }}<br>@endif
                            @if(!empty($company['phone_number']))Phone: {{ $company['phone_number'] }}<br>@endif
                            @if(!empty($company['email_address']))Email: {{ $company['email_address'] }}<br>@endif
                        </div>
                    </td>
                    <td width="35%">
                        <div class="inv-title">INVOICE</div>
                        <table class="inv-title-meta" cellpadding="0" cellspacing="0">
                            <tr>
                                <td class="inv-label">Date</td>
                                <td class="inv-value">{{ $inv['date'] }}</td>
                            </tr>
                            <tr>
                                <td class="inv-label">Invoice No.</td>
                                <td class="inv-value">{{ $inv['invoice_no'] }}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <hr class="inv-rule" />

            <table class="inv-parties" cellpadding="0" cellspacing="0">
                <tr>
                    <td>
                        <div class="inv-party-label">Charge To</div>
                        {{ $inv['customer_name'] }}<br>
                        {!! nl2br(e($cleanAddress($inv['customer_address'] ?? ''))) !!}
                    </td>
                    <td>
                        <div class="inv-party-label">Delivered To</div>
                        {{ $inv['delivered_name'] }}<br>
                        {!! nl2br(e($cleanAddress($inv['delivered_address'] ?? ''))) !!}
                    </td>
                </tr>
            </table>

            <table class="inv-meta-row" cellpadding="0" cellspacing="0">
                <tr>
                    <th width="24%">Customer's Reference</th>
                    <th width="19%">Sales Person</th>
                    <th width="19%">Your VAT no.</th>
                    <th width="19%">Date of Sale</th>
                    <th width="19%">Due Date</th>
                </tr>
                <tr>
                    <td>{{ $inv['customer_reference'] ?? '' }}</td>
                    <td>{{ $inv['sales_person'] ?? '' }}</td>
                    <td>{{ $inv['vat_no'] ?? '' }}</td>
                    <td>{{ $inv['date'] }}</td>
                    <td>{{ $inv['due_date'] }}</td>
                </tr>
            </table>

            @if(!empty($inv['payment_terms']))
                <div class="inv-terms">Payment Terms: {{ ucfirst($inv['payment_terms']) }}</div>
            @endif

            <table class="inv-items" cellpadding="0" cellspacing="0">
                <thead>
                    <tr>
                        <th width="12%">Item Code</th>
                        <th width="38%">Item Description</th>
                        <th width="10%" class="text-right">Quantity</th>
                        <th width="8%">Unit</th>
                        <th width="12%" class="text-right">Price</th>
                        <th width="10%" class="text-right">Discount %</th>
                        <th width="10%" class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($inv['lines'] as $line)
                        <tr>
                            <td>{{ $line['item_code'] }}</td>
                            <td>{!! nl2br(e($line['description'])) !!}</td>
                            <td class="text-right">{{ number_format($line['quantity'], 2) }}</td>
                            <td>{{ $line['unit'] }}</td>
                            <td class="text-right">{{ number_format($line['price'], 2) }}</td>
                            <td class="text-right">{{ number_format($line['discount'], 2) }}</td>
                            <td class="text-right">{{ number_format($line['total'], 2) }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="text-center">No items recorded for this invoice.</td>
                        </tr>
                    @endforelse

                    <tr class="inv-totals-row">
                        <td colspan="6" class="inv-totals-label">Sub-total</td>
                        <td class="inv-totals-value">{{ number_format($inv['subtotal'], 2) }}</td>
                    </tr>
                    @if(($inv['discount'] ?? 0) != 0)
                        <tr class="inv-totals-row">
                            <td colspan="6" class="inv-totals-label">Discount</td>
                            <td class="inv-totals-value">{{ number_format($inv['discount'], 2) }}</td>
                        </tr>
                    @endif
                    @if(($inv['freight'] ?? 0) != 0)
                        <tr class="inv-totals-row">
                            <td colspan="6" class="inv-totals-label">Shipping / Freight</td>
                            <td class="inv-totals-value">{{ number_format($inv['freight'], 2) }}</td>
                        </tr>
                    @endif
                    @if(($inv['tax'] ?? 0) != 0)
                        <tr class="inv-totals-row">
                            <td colspan="6" class="inv-totals-label">Tax</td>
                            <td class="inv-totals-value">{{ number_format($inv['tax'], 2) }}</td>
                        </tr>
                    @endif
                    <tr class="inv-totals-row inv-grand">
                        <td colspan="6" class="inv-totals-label">TOTAL INVOICE</td>
                        <td class="inv-totals-value">{{ number_format($inv['total'], 2) }}</td>
                    </tr>
                </tbody>
            </table>

            <div class="inv-footer">
                Please quote invoice no. when paying.
                @if(!empty($inv['currency'])) All amounts stated in - {{ $inv['currency'] }}@endif
                @if(!empty($bankAccount))
                    <br>Bank: {{ $bankAccount['bank_name'] }}, Bank Account: {{ $bankAccount['bank_account_number'] }}
                @endif
            </div>
        </div>
    @endforeach
</body>
</html>
