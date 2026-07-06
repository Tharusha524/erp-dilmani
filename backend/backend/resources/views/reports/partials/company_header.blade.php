@php
    $company = $companyHeader ?? [];
    $show = !empty($company['name']) || !empty($company['address']) || !empty($company['phone_number']) || !empty($company['show_logo']);
@endphp

@if($show)
<table class="erp-header-table" cellpadding="0" cellspacing="0">
    <tr>
        @if(!empty($company['show_logo']) && !empty($company['logo_path']))
        <td class="erp-logo-cell" width="95">
            <img src="{{ $company['logo_path'] }}" alt="Logo" />
        </td>
        @endif
        <td>
            @if(!empty($company['name']))
                <div class="erp-company-name">{{ $company['name'] }}</div>
            @endif
            @if(!empty($company['address']))
                <div class="erp-company-line">{!! nl2br(e($company['address'])) !!}</div>
            @endif
            @if(!empty($company['phone_number']))
                <div class="erp-company-line"><strong>Tel:</strong> {{ $company['phone_number'] }}</div>
            @endif
        </td>
    </tr>
</table>
@endif
