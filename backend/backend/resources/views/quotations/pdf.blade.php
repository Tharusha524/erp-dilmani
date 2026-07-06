<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quotation #{{ $quotation->quotation_number ?? 'N/A' }}</title>
    @include('reports.partials.pdf_common_styles')
    <style>
        table.erp-doc-meta { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.erp-doc-meta td { border: none; padding: 4px 0; font-size: 10px; vertical-align: top; }
        table.erp-totals-table { width: 45%; margin-left: 55%; border-collapse: collapse; margin-top: 10px; }
        table.erp-totals-table td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10px; }
        .comments-box { margin-top: 14px; padding: 10px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-size: 10px; }
    </style>
</head>
<body>
    @include('reports.partials.company_header', ['companyHeader' => $companyHeader ?? []])

    <table class="erp-doc-meta" cellpadding="0" cellspacing="0">
        <tr>
            <td width="55%">
                <strong style="font-size: 16px; color: #0b1f44;">QUOTATION</strong>
            </td>
            <td width="45%" style="text-align: right;">
                <strong>Number:</strong> {{ $quotation->quotation_number ?? 'N/A' }}<br>
                <strong>Date:</strong> {{ $quotation->quotation_date ? $quotation->quotation_date->format('d/m/Y') : 'N/A' }}<br>
                <strong>Status:</strong> {{ ucfirst($quotation->status ?? 'draft') }}
            </td>
        </tr>
    </table>

    <table class="erp-data-table" border="1" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
        <tr>
            <th width="50%">Bill To</th>
            <th width="50%">Ship To</th>
        </tr>
        <tr>
            <td>
                <strong>{{ $quotation->debtor->name ?? 'N/A' }}</strong><br>
                {{ $quotation->debtor->address ?? 'N/A' }}<br>
                @if($quotation->contact_email) Email: {{ $quotation->contact_email }}<br>@endif
                @if($quotation->contact_phone) Tel: {{ $quotation->contact_phone }}@endif
            </td>
            <td>
                {{ $quotation->delivery_address ?? $quotation->debtor->address ?? 'Same as above' }}<br>
                @if($quotation->delivery_date)
                    <strong>Delivery Date:</strong> {{ $quotation->delivery_date->format('d/m/Y') }}
                @endif
            </td>
        </tr>
    </table>

    <table class="erp-data-table" border="1" cellpadding="0" cellspacing="0" width="100%">
        <thead>
            <tr>
                <th>Item Code</th>
                <th>Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Disc %</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @php
                $useLongDescriptions = !empty($companyHeader['use_long_descriptions_on_invoices']);
            @endphp
            @forelse($quotation->details ?? [] as $index => $detail)
            <tr @if($index % 2 === 1) class="erp-row-alt" @endif>
                <td>{{ $detail->stk_code ?? 'N/A' }}</td>
                <td>
                    {{ $detail->description ?? 'N/A' }}
                    @if($useLongDescriptions && !empty($detail->stock?->long_description))
                        <br><span style="font-size: 9px; color: #475569;">{{ $detail->stock->long_description }}</span>
                    @endif
                </td>
                <td class="text-right">{{ number_format($detail->quantity ?? 0, 2) }}</td>
                <td class="text-right">{{ number_format($detail->unit_price ?? 0, 2) }}</td>
                <td class="text-right">{{ $detail->discount_percent ?? 0 }}%</td>
                <td class="text-right">{{ number_format($detail->line_total ?? 0, 2) }}</td>
            </tr>
            @empty
            <tr><td colspan="6">No items</td></tr>
            @endforelse
        </tbody>
    </table>

    <table class="erp-totals-table" border="1" cellpadding="0" cellspacing="0">
        <tr>
            <td><strong>Subtotal</strong></td>
            <td class="text-right">{{ number_format(($quotation->total ?? 0) - ($quotation->freight_cost ?? 0), 2) }}</td>
        </tr>
        @if($quotation->freight_cost)
        <tr>
            <td><strong>Freight Cost</strong></td>
            <td class="text-right">{{ number_format($quotation->freight_cost, 2) }}</td>
        </tr>
        @endif
        <tr class="total-row">
            <td><strong>TOTAL AMOUNT</strong></td>
            <td class="text-right"><strong>{{ number_format($quotation->total ?? 0, 2) }}</strong></td>
        </tr>
    </table>

    @if($quotation->comments)
    <div class="comments-box">
        <strong>Additional Information</strong><br>
        {{ $quotation->comments }}
    </div>
    @endif

    <div class="erp-footer">
        Valid until {{ $quotation->delivery_date ? $quotation->delivery_date->format('d/m/Y') : 'further notice' }} |
        Generated {{ $companyHeader['report_generated_at'] ?? now()->format('d/m/Y H:i') }}
    </div>
</body>
</html>
