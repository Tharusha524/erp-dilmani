<style>
    body {
        font-family: dejavusans, sans-serif;
        font-size: 9px;
        color: #1e293b;
        margin: 0;
        padding: 0;
        line-height: 1.35;
    }

    /* Compact report header — company + report name in one row */
    table.erp-report-header {
        width: 100%;
        border: 1px solid #94a3b8;
        border-collapse: collapse;
        margin-bottom: 8px;
        background-color: #f8fafc;
    }
    table.erp-report-header td {
        border: none;
        padding: 5px 8px;
        vertical-align: middle;
    }
    .erp-rh-logo {
        width: 52px;
    }
    .erp-rh-logo img {
        width: 44px;
        height: 34px;
    }
    .erp-rh-company-name {
        font-size: 10px;
        font-weight: bold;
        color: #0f172a;
        margin: 0 0 2px 0;
    }
    .erp-rh-meta {
        font-size: 7.5px;
        color: #475569;
        line-height: 1.3;
        margin: 0;
    }
    .erp-rh-report {
        text-align: right;
        border-left: 1px solid #cbd5e1 !important;
        background-color: #eef2ff;
    }
    .erp-rh-report-name {
        font-size: 11px;
        font-weight: bold;
        color: #0b1f44;
        margin: 0 0 2px 0;
    }
    .erp-rh-report-period {
        font-size: 8px;
        color: #334155;
        margin: 0 0 2px 0;
    }
    .erp-rh-generated {
        font-size: 7px;
        color: #64748b;
    }

    /* Legacy aliases (customer-specific blades) */
    .erp-report-title { display: none; }
    .erp-report-subtitle { display: none; }

    table.erp-data-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 4px;
        margin-bottom: 8px;
    }
    table.erp-data-table th {
        background-color: #0b1f44;
        color: #ffffff;
        font-size: 8px;
        font-weight: bold;
        padding: 4px 5px;
        border: 1px solid #0b1f44;
        text-align: left;
    }
    table.erp-data-table td {
        font-size: 8px;
        padding: 3px 5px;
        border: 1px solid #cbd5e1;
        vertical-align: top;
        word-wrap: break-word;
    }
    table.erp-data-table tr.erp-row-alt td {
        background-color: #f8fafc;
    }
    table.erp-data-table tr.erp-section-row td {
        background-color: #1565c0;
        color: #ffffff;
        font-weight: bold;
        font-size: 8.5px;
        padding: 4px 5px;
        border: 1px solid #0d47a1;
    }
    table.erp-data-table tr.erp-group-row td {
        background-color: #e3f2fd;
        color: #1565c0;
        font-weight: bold;
        font-size: 8px;
        padding: 3px 5px 3px 12px;
    }
    table.erp-data-table tr.erp-subtotal-row td {
        background-color: #f1f5f9;
        font-weight: bold;
        font-size: 8px;
    }
    table.erp-data-table tr.erp-grand-row td {
        background-color: #e2e8f0;
        font-weight: bold;
        font-size: 8.5px;
        border-top: 2px solid #0f172a;
    }
    table.erp-data-table tr.erp-equation-row td {
        background-color: #dcfce7;
        font-weight: bold;
        font-size: 8.5px;
    }
    table.erp-data-table tr.erp-equation-row.erp-unbalanced td {
        background-color: #fee2e2;
    }

    table.erp-params-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 6px;
    }
    table.erp-params-table th {
        background-color: #e2e8f0;
        font-size: 7.5px;
        padding: 3px 5px;
        border: 1px solid #cbd5e1;
        width: 30%;
    }
    table.erp-params-table td {
        font-size: 7.5px;
        padding: 3px 5px;
        border: 1px solid #cbd5e1;
    }

    .erp-footer {
        font-size: 7px;
        color: #94a3b8;
        text-align: right;
        margin-top: 6px;
    }
    .erp-empty {
        text-align: center;
        padding: 10px;
        color: #64748b;
        font-size: 9px;
        border: 1px dashed #94a3b8;
        margin-top: 6px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .pl-12 { padding-left: 12px !important; }
    .pl-18 { padding-left: 18px !important; }
</style>
