import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getInternalServiceInvoice } from "../../../../api/InternalServiceInvoice/InternalServiceInvoiceApi";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getBranches } from "../../../../api/CustomerBranch/CustomerBranchApi";
import { getCostCenters } from "../../../../api/CostCenter/CostCenterApi";
import { getPaymentTerms } from "../../../../api/PaymentTerm/PaymentTermApi";
import { getSalesTypes } from "../../../../api/SalesMaintenance/salesService";
import { getShippingCompanies } from "../../../../api/ShippingCompany/ShippingCompanyApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getItemUnits } from "../../../../api/ItemUnit/ItemUnitApi";
import { TransactionPrintPage, TransactionPrintTemplate } from "../../../../components/Print";
import { STANDARD_ITEM_PRINT_COLUMNS } from "../../../../utils/transactionPrintColumns";

/**
 * View/print screen for an Internal Service Invoice. Reads only from
 * internal_service_invoices / internal_service_invoice_lines (via
 * getInternalServiceInvoice) — never from debtor_trans/gl_trans, keeping
 * this module isolated the same way the entry screen is.
 */
export default function ViewInternalServiceInvoice() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { id, reference: refFromState, autoPrint } = state || {};

    const { data: invoice } = useQuery({
        queryKey: ["internalServiceInvoice", id],
        queryFn: () => getInternalServiceInvoice(id),
        enabled: !!id,
    });

    const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
    const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: () => getBranches() });
    const { data: costCenters = [] } = useQuery({ queryKey: ["costCenters"], queryFn: getCostCenters });
    const { data: paymentTerms = [] } = useQuery({ queryKey: ["payments"], queryFn: getPaymentTerms });
    const { data: salesTypes = [] } = useQuery({ queryKey: ["priceLists"], queryFn: getSalesTypes });
    const { data: shippingCompanies = [] } = useQuery({ queryKey: ["shippingCompanies"], queryFn: getShippingCompanies });
    const { data: stockMasters = [] } = useQuery({ queryKey: ["stockMasters"], queryFn: getItems });
    const { data: itemUnits = [] } = useQuery({ queryKey: ["itemUnits"], queryFn: getItemUnits });

    const customerName = useMemo(() => {
        const found = (customers || []).find((c: any) => String(c.debtor_no) === String(invoice?.debtor_no));
        return found?.name || "-";
    }, [customers, invoice]);

    const branchName = useMemo(() => {
        const found = (branches || []).find((b: any) => String(b.branch_code) === String(invoice?.branch_code));
        return found?.br_name || invoice?.deliver_to || "-";
    }, [branches, invoice]);

    const costCenterName = useMemo(() => {
        const found = (costCenters || []).find((cc: any) => String(cc.id) === String(invoice?.cost_center_id));
        return found?.name || "-";
    }, [costCenters, invoice]);

    const paymentTermsValue = useMemo(() => {
        const found = (paymentTerms || []).find((pt: any) => String(pt.terms_indicator) === String(invoice?.payment_terms));
        return found?.description || "-";
    }, [paymentTerms, invoice]);

    const salesTypeValue = useMemo(() => {
        const found = (salesTypes || []).find((st: any) => String(st.id) === String(invoice?.order_type));
        return found?.typeName || "-";
    }, [salesTypes, invoice]);

    const shippingCompanyName = useMemo(() => {
        const found = (shippingCompanies || []).find((s: any) => String(s.shipper_id) === String(invoice?.ship_via));
        return found?.shipper_name || "-";
    }, [shippingCompanies, invoice]);

    const resolvedLines = useMemo(() => {
        return (invoice?.lines || []).map((line: any) => {
            const stock = (stockMasters || []).find((sm: any) => sm.stock_id === line.stock_id);
            const unit = (itemUnits || []).find((iu: any) => iu.id === stock?.units);
            const total = Number(line.quantity) * Number(line.unit_price) * (1 - (Number(line.discount_percent) || 0) / 100);
            return { ...line, unitAbbr: unit?.abbr || "-", total };
        });
    }, [invoice, stockMasters, itemUnits]);

    const subtotal = useMemo(
        () => resolvedLines.reduce((sum: number, l: any) => sum + l.total, 0),
        [resolvedLines]
    );

    const total = Number(invoice?.advance_amount ?? 0) + Number(invoice?.balance_due ?? 0);

    const printLines = useMemo(
        () =>
            resolvedLines.map((l: any) => ({
                item: l.stock_id ?? "—",
                description: l.description ?? "—",
                quantity: l.quantity ?? "—",
                unit: l.unitAbbr ?? "—",
                price: Number(l.unit_price ?? 0).toFixed(2),
                discount: l.discount_percent != null ? `${l.discount_percent}%` : "—",
                total: l.total?.toFixed(2) ?? "—",
            })),
        [resolvedLines]
    );

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Internal Service Invoice" },
    ];

    return (
        <TransactionPrintPage
            pageTitle={`Internal Service Invoice - ${invoice?.reference || refFromState || "—"}`}
            breadcrumbs={breadcrumbItems}
            onBack={() => navigate(-1)}
            autoPrint={autoPrint}
            ready={Boolean(invoice)}
            printContent={
                <TransactionPrintTemplate
                    documentType="Internal Service Invoice"
                    documentNumber={invoice?.id}
                    reference={invoice?.reference}
                    documentDate={invoice?.tran_date}
                    dueDate={invoice?.due_date}
                    partyName={customerName}
                    partyLines={[branchName !== "-" ? branchName : ""].filter(Boolean)}
                    documentFields={[
                        { label: "Customer Order Ref", value: invoice?.customer_ref || "—" },
                        { label: "Payment Terms", value: paymentTermsValue },
                        { label: "Sales Type", value: salesTypeValue },
                        { label: "Cost Center", value: costCenterName },
                        { label: "Shipping", value: shippingCompanyName },
                    ]}
                    columns={STANDARD_ITEM_PRINT_COLUMNS}
                    lines={printLines}
                    totals={{
                        subtotal,
                        total,
                        paidAmount: Number(invoice?.advance_amount ?? 0),
                    }}
                    comments={invoice?.comments}
                    footerNote="Internal Service Invoice — not a customer receivable; does not affect AR or GL."
                />
            }
        />
    );
}
