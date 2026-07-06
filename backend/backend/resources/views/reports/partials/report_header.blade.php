@php
    $company = $companyHeader ?? [];
    $reportTitle = $title ?? 'Report';
    $reportSubtitle = $subtitle ?? null;
    $generatedAt = $company['report_generated_at'] ?? date('Y-m-d H:i');
@endphp

<table class="erp-report-header" cellpadding="0" cellspacing="0" width="100%">
    <tr>
        @if(!empty($company['show_logo']) && !empty($company['logo_path']))
        <td class="erp-rh-logo" width="52">
            <img src="{{ $company['logo_path'] }}" alt="" />
        </td>
        @endif
        <td class="erp-rh-company">
            @if(!empty($company['name']))
                <div class="erp-rh-company-name">{{ $company['name'] }}</div>
            @endif
            @if(!empty($company['address']))
                <div class="erp-rh-meta">{!! nl2br(e($company['address'])) !!}</div>
            @endif
            @if(!empty($company['phone_number']) || !empty($company['email_address']))
                <div class="erp-rh-meta">
                    @if(!empty($company['phone_number']))<span>Tel: {{ $company['phone_number'] }}</span>@endif
                    @if(!empty($company['email_address']))<span> | {{ $company['email_address'] }}</span>@endif
                </div>
            @endif
        </td>
        <td class="erp-rh-report" width="38%">
            <div class="erp-rh-report-name">{{ $reportTitle }}</div>
            @if($reportSubtitle)
                <div class="erp-rh-report-period">{{ $reportSubtitle }}</div>
            @endif
            <div class="erp-rh-generated">Generated: {{ $generatedAt }}</div>
        </td>
    </tr>
</table>
