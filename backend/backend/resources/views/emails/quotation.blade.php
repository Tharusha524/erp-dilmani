@component('mail::message')
# Quotation #{{ $quotation->quotation_number }}

Dear {{ $quotation->debtor->name ?? 'Valued Customer' }},

Thank you for your interest. Please find below the details of your quotation.

## Quotation Details

**Quotation Number:** {{ $quotation->quotation_number }}  
**Date:** {{ $quotation->quotation_date->format('Y-m-d') }}  
**Valid Until:** {{ $quotation->delivery_date ? $quotation->delivery_date->format('Y-m-d') : 'N/A' }}

## Line Items

| Item | Description | Qty | Unit Price | Discount | Total |
|------|-------------|-----|-----------|----------|-------|
@foreach($quotation->details as $detail)
| {{ $detail->stk_code }} | {{ $detail->description }} | {{ $detail->quantity }} | {{ number_format($detail->unit_price, 2) }} | {{ $detail->discount_percent ?? 0 }}% | {{ number_format($detail->line_total, 2) }} |
@endforeach

**Freight Cost:** {{ number_format($quotation->freight_cost ?? 0, 2) }}  
**Total Amount:** {{ number_format($quotation->total, 2) }}

@if($quotation->comments)
## Additional Information
{{ $quotation->comments }}
@endif

@if($quotation->contact_phone)
**Contact Phone:** {{ $quotation->contact_phone }}
@endif

@component('mail::button', ['url' => config('app.url')])
View Quotation
@endcomponent

Thank you for your business!

Best regards,  
{{ config('app.name') }}
@endcomponent
