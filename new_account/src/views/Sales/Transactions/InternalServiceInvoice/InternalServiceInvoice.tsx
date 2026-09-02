import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useState, useMemo, useEffect } from "react";
import {
    Box,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableFooter,
    Paper,
    TextField,
    Typography,
    MenuItem,
    Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createInternalServiceInvoice } from "../../../../api/InternalServiceInvoice/InternalServiceInvoiceApi";
import { getDebtorTrans } from "../../../../api/DebtorTrans/DebtorTransApi";
import { useNextFiscalYearReference } from "../../../../hooks/useNextFiscalYearReference";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getBranches, createBranch } from "../../../../api/CustomerBranch/CustomerBranchApi";
import { getSysPrefs } from "../../../../api/OrganizationSettings/SysPrefsApi";
import { getPaymentTerms } from "../../../../api/PaymentTerm/PaymentTermApi";
import { getSalesTypes } from "../../../../api/SalesMaintenance/salesService";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getBankAccounts } from "../../../../api/BankAccount/BankAccountApi";
import { getItems, getItemById } from "../../../../api/Item/ItemApi";
import { getItemUnits } from "../../../../api/ItemUnit/ItemUnitApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { getSalesPricingByStockId } from "../../../../api/SalesPricing/SalesPricingApi";
import { getShippingCompanies } from "../../../../api/ShippingCompany/ShippingCompanyApi";
import { getFiscalYears } from "../../../../api/FiscalYear/FiscalYearApi";
import { getCompanies } from "../../../../api/CompanySetup/CompanySetupApi";
import useCurrentUser from "../../../../hooks/useCurrentUser";
import { getSalesPosList } from "../../../../api/SalePos/SalePosApi";
import { getTaxGroupItemsByGroupId } from "../../../../api/Tax/TaxGroupItemApi";
import { getTaxTypes } from "../../../../api/Tax/taxServices";
import { getStockMoves } from "../../../../api/StockMoves/StockMovesApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import AddedConfirmationModal from "../../../../components/AddedConfirmationModal";
import { getCostCenters } from "../../../../api/CostCenter/CostCenterApi";
import { enqueueSnackbar } from "notistack";
import {
    isCashSalePaymentTerm,
    validateCustomerCreditForSale,
} from "../../../../utils/customerCredit";
import { isAdvanceBalancePaymentTerm } from "../../../../utils/paymentTermHelpers";
import { useCustomerCredit } from "../../../../hooks/useCustomerCredit";
import CustomerCreditSummaryFields from "../../../../components/CustomerCreditSummaryFields";
import CustomerCurrencyField from "../../../../components/CustomerCurrencyField";
import CurrencyAmountInput from "../../../../components/CurrencyAmountInput";
import ItemSearchSelect from "../../../../components/ItemSearchSelect";
import {
    customerPaymentTermId,
    customerSalesTypeId,
    customerCurrencyCode,
    relationId,
} from "../../../../utils/relationId";
import { resolveSalesItemLinePrices } from "../../../../utils/resolveSalesItemPrice";
import { useHomeCurrency } from "../../../../hooks/useHomeCurrency";
import { useTransactionMoney } from "../../../../hooks/useTransactionMoney";
import FormattedNumberField from "../../../../components/FormattedNumberField";

function bankAccountTypeId(acc: any): number {
    const raw = acc?.account_type ?? acc?.accountType;
    if (raw == null) return 0;
    if (typeof raw === "number" || typeof raw === "string") return Number(raw) || 0;
    if (typeof raw === "object") return Number(raw.id) || 0;
    return 0;
}

function isCashBankAccount(acc: any): boolean {
    const typeId = bankAccountTypeId(acc);
    if (typeId === 4) return true;
    const typeName = String(
        acc?.accountType?.type_name ?? acc?.account_type?.type_name ?? ""
    ).toLowerCase();
    return typeName.includes("cash");
}

function bankAccountLabel(acc: any): string {
    const name = acc?.bank_account_name ?? acc?.name ?? "";
    const gl = acc?.account_gl_code ?? acc?.accountGl?.account_code ?? "";
    return gl ? `${name} (${gl})` : String(name);
}

/**
 * Internal Service Invoice — same core screen/logic as Direct Invoice
 * (customer, items, pricing, tax, payment terms, advance payment), minus
 * Work Order creation and the reference barcode. Everything it saves goes
 * to internal_service_invoices / internal_service_invoice_lines, not
 * debtor_trans/stock_moves/gl_trans — so it never affects customer
 * balances, stock quantities, or GL/reports elsewhere.
 */
export default function InternalServiceInvoice() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { code: homeCurrencyCode } = useHomeCurrency();

    const [open, setOpen] = useState(false);

    // ===== Form fields =====
    const [customer, setCustomer] = useState("");
    const [branch, setBranch] = useState("");
    const [reference, setReference] = useState("");
    const [discount, setDiscount] = useState(0);
    const [payment, setPayment] = useState("");
    const [priceList, setPriceList] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);

    const { reference: nextInvoiceReference } = useNextFiscalYearReference(10, {
        asOfDate: invoiceDate,
    });
    const [deliverFrom, setDeliverFrom] = useState("");
    const [cashAccount, setCashAccount] = useState("");
    const [advanceAmount, setAdvanceAmount] = useState<string>("");
    const [costCenter, setCostCenter] = useState("");
    const [comments, setComments] = useState("");
    const [dateError, setDateError] = useState("");
    const [shippingCharge, setShippingCharge] = useState(0);
    const [priceColumnLabel, setPriceColumnLabel] = useState("Price After Tax");

    const [deliverTo, setDeliverTo] = useState("");
    const [address, setAddress] = useState("");
    const [customerReference, setCustomerReference] = useState("");
    const [shippingCompany, setShippingCompany] = useState("");

    // Normalize select values when API returned relation objects (e.g. sales_type: { id: 1 })
    useEffect(() => {
        if (String(priceList) === "[object Object]") setPriceList("");
        else {
            const fixedPrice = relationId(priceList, "id");
            if (priceList && fixedPrice && fixedPrice !== String(priceList)) setPriceList(fixedPrice);
        }
        if (String(payment) === "[object Object]") setPayment("");
        else {
            const fixedPayment = relationId(payment, "terms_indicator", "id");
            if (payment && fixedPayment && fixedPayment !== String(payment)) setPayment(fixedPayment);
        }
        if (String(shippingCompany) === "[object Object]") setShippingCompany("");
        else {
            const fixedShip = relationId(shippingCompany, "shipper_id", "id");
            if (shippingCompany && fixedShip && fixedShip !== String(shippingCompany)) setShippingCompany(fixedShip);
        }
        if (String(deliverFrom) === "[object Object]") setDeliverFrom("");
        else {
            const fixedLoc = relationId(deliverFrom, "loc_code", "code");
            if (deliverFrom && fixedLoc && fixedLoc !== String(deliverFrom)) setDeliverFrom(fixedLoc);
        }
    }, [priceList, payment, shippingCompany, deliverFrom]);

    // ===== Fetch master data =====
    const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
    const selectedCustomer = useMemo(
        () => customers.find((c: any) => String(c.debtor_no) === String(customer)),
        [customers, customer]
    );
    const customerCurrency = customerCurrencyCode(selectedCustomer);
    const { formatMoney } = useTransactionMoney(customerCurrency);
    const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: () => getBranches() });
    const { data: paymentTerms = [] } = useQuery({ queryKey: ["payments"], queryFn: getPaymentTerms });
    const { data: priceLists = [] } = useQuery({ queryKey: ["priceLists"], queryFn: getSalesTypes });
    const { data: locations = [] } = useQuery({ queryKey: ["locations"], queryFn: getInventoryLocations });
    const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: getItems });
    const { data: itemUnits = [] } = useQuery({ queryKey: ["itemUnits"], queryFn: getItemUnits });
    const { data: categories = [] } = useQuery({ queryKey: ["itemCategories"], queryFn: () => getItemCategories() });
    const { data: shippingCompanies = [] } = useQuery({ queryKey: ["shippingCompanies"], queryFn: getShippingCompanies });
    const { data: fiscalYears = [] } = useQuery({ queryKey: ["fiscalYears"], queryFn: getFiscalYears });
    const { data: companyData } = useQuery({ queryKey: ["company"], queryFn: getCompanies });
    const { data: costCenters = [] } = useQuery({ queryKey: ["costCenters"], queryFn: getCostCenters });
    const { data: bankAccounts = [] } = useQuery({ queryKey: ["bankAccounts"], queryFn: getBankAccounts });
    const { user } = useCurrentUser();
    const { data: debtorTrans = [] } = useQuery({ queryKey: ["debtorTrans"], queryFn: getDebtorTrans });
    const { data: taxTypes = [] } = useQuery({ queryKey: ["taxTypes"], queryFn: getTaxTypes });
    const { data: posList = [] } = useQuery({ queryKey: ["salesPos"], queryFn: getSalesPosList });

    // All active bank accounts (cash types first) — strict cash-only filter hid POS/chequing accounts.
    const cashBankAccounts = useMemo(() => {
        const active = (bankAccounts as any[]).filter((acc) => !acc.inactive);
        const cash = active.filter(isCashBankAccount);
        const other = active.filter((acc) => !isCashBankAccount(acc));
        return [...cash, ...other];
    }, [bankAccounts]);

    const selectedCashBankAccount = useMemo(
        () => cashBankAccounts.find((acc: any) => String(acc.id) === String(cashAccount)),
        [cashBankAccounts, cashAccount]
    );

    // Find selected fiscal year from company setup
    const selectedFiscalYear = useMemo(() => {
        if (!companyData || companyData.length === 0) return null;
        const company = companyData[0];
        return fiscalYears.find((fy: any) => fy.id === company.fiscal_year_id);
    }, [companyData, fiscalYears]);

    // Set initial date based on selected fiscal year
    useEffect(() => {
        if (selectedFiscalYear) {
            const currentYear = new Date().getFullYear();
            const fiscalYear = new Date(selectedFiscalYear.fiscal_year_from).getFullYear();
            let initialDate = "";
            if (fiscalYear === currentYear) {
                initialDate = new Date().toISOString().split("T")[0];
            } else {
                initialDate = new Date(selectedFiscalYear.fiscal_year_from).toISOString().split("T")[0];
            }
            setInvoiceDate(initialDate);
            validateDate(initialDate); // Validate immediately to show error if invalid
        }
    }, [selectedFiscalYear]);

    // Validate date is within fiscal year
    const validateDate = (selectedDate: string) => {
        if (!selectedFiscalYear) {
            setDateError("No fiscal year selected from company setup");
            return false;
        }

        if (selectedFiscalYear.closed) {
            setDateError("The fiscal year is closed for further data entry.");
            return false;
        }

        const selected = new Date(selectedDate);
        const from = new Date(selectedFiscalYear.fiscal_year_from);
        const to = new Date(selectedFiscalYear.fiscal_year_to);

        if (selected < from || selected > to) {
            setDateError("The entered date is out of fiscal year.");
            return false;
        }

        setDateError("");
        return true;
    };

    // Auto-select POS and set default bank account / location
    useEffect(() => {
        if (posList && posList.length > 0) {
            const defaultPos = posList.find((p: any) => !p.inactive) || posList[0];
            if (defaultPos) {
                if (defaultPos.pos_account && !cashAccount) {
                    const pa = defaultPos.pos_account;
                    const paId =
                        pa != null && typeof pa === "object" && !Array.isArray(pa)
                            ? (pa as { id?: unknown; bank_account_id?: unknown; bank_act?: unknown; account_id?: unknown }).id ??
                            (pa as { bank_account_id?: unknown }).bank_account_id ??
                            (pa as { bank_act?: unknown }).bank_act ??
                            (pa as { account_id?: unknown }).account_id ??
                            pa
                            : pa;
                    if (paId != null) setCashAccount(String(paId));
                }
                if (defaultPos.pos_location && !deliverFrom) {
                    const pl = defaultPos.pos_location;
                    const plCode =
                        pl != null && typeof pl === "object" && !Array.isArray(pl)
                            ? (pl as { loc_code?: unknown; code?: unknown; id?: unknown }).loc_code ??
                            (pl as { code?: unknown }).code ??
                            (pl as { id?: unknown }).id ??
                            pl
                            : pl;
                    if (plCode != null) setDeliverFrom(String(plCode));
                }
            }
        }
    }, [posList, cashAccount, deliverFrom]);

    // Update branch based on customer — only when current branch does not belong to customer
    useEffect(() => {
        if (!customer || branches.length === 0) return;
        const customerBranches = branches.filter((b: any) => String(b.debtor_no) === String(customer));
        const branchBelongsToCustomer = customerBranches.some(
            (b: any) => String(b.branch_code) === String(branch)
        );
        if (!branchBelongsToCustomer) {
            const defaultBranch = customerBranches.find((b: any) => !b.inactive) || customerBranches[0];
            setBranch(defaultBranch ? String(defaultBranch.branch_code) : "");
        }
    }, [customer, branches, branch]);

    // Update branch details: location, payment, priceList, tax group
    useEffect(() => {
        if (branch && branches.length > 0) {
            const selectedBranch = branches.find((b: any) => String(b.branch_code) === String(branch));
            if (selectedBranch) {
                if (selectedBranch.inventory_location && !deliverFrom) {
                    setDeliverFrom(selectedBranch.inventory_location);
                }
                if (selectedBranch.shipping_company && !shippingCompany) {
                    const shipId = relationId(selectedBranch.shipping_company, "shipper_id", "id");
                    if (shipId) setShippingCompany(shipId);
                }
                if (selectedBranch.tax_group) {
                    getTaxGroupItemsByGroupId(selectedBranch.tax_group).then(setTaxGroupItems);
                }
            }
        }
    }, [branch, branches, deliverFrom, shippingCompany]);

    // Update customer-level defaults
    useEffect(() => {
        if (customer && customers.length > 0) {
            const cust = customers.find((c: any) => String(c.debtor_no) === String(customer));
            if (cust) {
                if (!payment) {
                    const pt = relationId(cust.payment_terms, "terms_indicator")
                        || relationId(cust.payment_term, "terms_indicator");
                    if (pt) setPayment(pt);
                }
                if (!priceList) {
                    const pl = relationId(cust.sales_type, "id");
                    if (pl) setPriceList(pl);
                }
                if (cust.discount !== undefined && discount === 0) {
                    setDiscount(cust.discount);
                }
            }
        }
    }, [customer, customers, payment, priceList, discount]);

    useEffect(() => {
        if (payment && paymentTerms.length > 0) {
            const term = paymentTerms.find(
                (t: any) => String(t.terms_indicator) === String(payment)
            );
            if (term && (term.cash_sale || term.days_before_due === 0) && cashBankAccounts.length > 0) {
                if (!cashAccount) {
                    setCashAccount(String(cashBankAccounts[0].id));
                }
            }
        }
    }, [payment, paymentTerms, cashBankAccounts, cashAccount]);

    // If POS/customer default bank id is not in the cash list, clear invalid selection.
    useEffect(() => {
        if (!cashAccount || cashBankAccounts.length === 0) return;
        const exists = cashBankAccounts.some((acc: any) => String(acc.id) === String(cashAccount));
        if (!exists) {
            setCashAccount(String(cashBankAccounts[0].id));
        }
    }, [cashAccount, cashBankAccounts]);

    // Handle date change with validation
    const handleDateChange = (value: string) => {
        setInvoiceDate(value);
        validateDate(value);
    };

    // ===== Tax-related state =====
    const [taxGroupItems, setTaxGroupItems] = useState<any[]>([]);

    // ===== Table rows =====
    const [rows, setRows] = useState([
        {
            id: 1,
            itemCode: "",
            description: "",
            quantity: 0,
            unit: "",
            priceAfterTax: 0,
            priceBeforeTax: 0,
            discount: 0,
            total: 0,
            selectedItemId: null as string | number | null,
            materialCost: 0,
            availableQuantity: 0,
        },
    ]);

    const handleAddRow = () => {
        setRows((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                itemCode: "",
                description: "",
                quantity: 0,
                unit: "",
                priceAfterTax: 0,
                priceBeforeTax: 0,
                discount: 0,
                total: 0,
                selectedItemId: null,
                materialCost: 0,
                availableQuantity: 0,
            },
        ]);
    };

    const handleRemoveRow = (id: number) => {
        setRows((prev) => prev.filter((r) => r.id !== id));
    };

    const handleChange = (id: number, field: string, value: any) => {
        setRows((prev) =>
            prev.map((r) =>
                r.id === id
                    ? {
                        ...r,
                        [field]: value,
                        total:
                            field === "quantity" ||
                                field === "priceAfterTax" ||
                                field === "priceBeforeTax" ||
                                field === "discount"
                                ? (field === "quantity" ? value : r.quantity) *
                                (field === "priceAfterTax" ? value : field === "priceBeforeTax" ? value : r.priceAfterTax || r.priceBeforeTax) *
                                (1 - (field === "discount" ? value : r.discount) / 100)
                                : r.total,
                    }
                    : r
            )
        );
    };

    const handleItemChange = async (rowId: number, selectedItem: any) => {
        handleChange(rowId, "description", selectedItem.description);
        handleChange(rowId, "itemCode", selectedItem.stock_id);
        handleChange(rowId, "selectedItemId", selectedItem.stock_id);

        // Fetch available quantity from stock_moves table
        let availableQty = 0;
        if (deliverFrom && selectedItem.stock_id) {
            try {
                const stockMoves = await getStockMoves();
                const relevantMoves = stockMoves.filter((move: any) =>
                    String(move.loc_code) === String(deliverFrom) &&
                    String(move.stock_id) === String(selectedItem.stock_id)
                );
                availableQty = relevantMoves.reduce((sum: number, move: any) => sum + (move.qty || 0), 0);
            } catch (error) {
                console.error("Error fetching stock moves:", error);
                availableQty = 0;
            }
        }
        handleChange(rowId, "availableQuantity", availableQty);
        handleChange(rowId, "quantity", 1);
        const itemData = await getItemById(selectedItem.stock_id);
        if (itemData) {
            const unitName = itemUnits.find((u: any) => u.id === itemData.units)?.abbr || "";
            handleChange(rowId, "unit", unitName);
            handleChange(rowId, "materialCost", itemData.material_cost || 0);
            const pricingList = await getSalesPricingByStockId(selectedItem.stock_id);
            const { priceAfterTax, priceBeforeTax } = resolveSalesItemLinePrices({
                pricingList,
                stockId: selectedItem.stock_id,
                salesTypeId: priceList,
                salesTypes: priceLists,
                currencyCode: customerCurrency,
                homeCurrencyCode,
                materialCost: Number(itemData.material_cost ?? 0),
            });
            handleChange(rowId, "priceAfterTax", priceAfterTax);
            handleChange(rowId, "priceBeforeTax", priceBeforeTax);
        }
    };

    // ===== Auto-generate reference: SI/{customer's invoice #}/{month}/{year} =====
    useEffect(() => {
        if (!customer) return;

        const invDate = invoiceDate ? new Date(`${invoiceDate}T00:00:00`) : new Date();
        const month = String(invDate.getMonth() + 1).padStart(2, "0");
        const yearShort = String(invDate.getFullYear()).slice(-2);

        const customerRefs = debtorTrans
            .filter((d: any) => Number(d.trans_type) === 10 && d.reference && String(d.debtor_no) === String(customer))
            .map((d: any) => d.reference as string);

        const nums = customerRefs
            .map((ref: string) => {
                const match = ref.match(/^SI\/(\d{3})\/\d{2}\/\d{2}$/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter((num: number) => !isNaN(num) && num > 0);

        const nextNumber = nums.length > 0 ? Math.max(...nums) + 1 : 1;
        const formattedNumber = nextNumber.toString().padStart(3, '0');
        setReference(`SI/${formattedNumber}/${month}/${yearShort}`);
    }, [customer, invoiceDate, debtorTrans]);

    // Auto-select first customer on load
    useEffect(() => {
        if (customers.length > 0 && !customer) {
            setCustomer(customers[0].debtor_no);
        }
    }, [customers, customer]);

    // Auto-select first location for deliverFrom on load
    useEffect(() => {
        if (locations.length > 0 && !deliverFrom) {
            const loc = relationId(locations[0].loc_code, "loc_code", "code")
                || relationId(locations[0], "loc_code", "code");
            if (loc) setDeliverFrom(loc);
        }
    }, [locations, deliverFrom]);

    // Reset branch when customer changes if current branch is not for that customer
    useEffect(() => {
        if (!customer) {
            setBranch("");
            return;
        }
        const customerBranches = branches.filter((b: any) => String(b.debtor_no) === String(customer));
        const branchBelongsToCustomer = customerBranches.some(
            (b: any) => String(b.branch_code) === String(branch)
        );
        if (!branchBelongsToCustomer) {
            const newBranch = customerBranches.length > 0 ? String(customerBranches[0].branch_code) : "";
            setBranch(newBranch);
        }
    }, [customer, branches, branch]);

    // Update deliver to and address when branch changes
    useEffect(() => {
        if (branch) {
            const selectedBranch = branches.find((b: any) => b.branch_code === branch);
            if (selectedBranch) {
                setDeliverTo(selectedBranch.br_name || "");
                setAddress(selectedBranch.br_address || "");

                if (selectedBranch.tax_group) {
                    getTaxGroupItemsByGroupId(selectedBranch.tax_group)
                        .then((items) => setTaxGroupItems(items))
                        .catch((err) => {
                            console.error("Failed to fetch tax group items:", err);
                            setTaxGroupItems([]);
                        });
                } else {
                    setTaxGroupItems([]);
                }
            }
        } else {
            setDeliverTo("");
            setAddress("");
            setTaxGroupItems([]);
        }
    }, [branch, branches]);

    // Update price column label when price list changes
    useEffect(() => {
        if (priceList) {
            const selected = priceLists.find((pl: any) => String(pl.id) === String(priceList));
            if (selected) {
                if (selected.taxIncl) {
                    setPriceColumnLabel("Price after Tax");
                } else {
                    setPriceColumnLabel("Price before Tax");
                }
            }
        } else {
            setPriceColumnLabel("Price after Tax");
        }
    }, [priceList, priceLists]);

    // Update prices when price list changes (guarded update)
    useEffect(() => {
        if (priceList) {
            const updatePrices = async () => {
                const selectedPriceList = priceLists.find((pl: any) => String(pl.id) === String(priceList));
                const newRows = await Promise.all(
                    rows.map(async (row) => {
                        if (row.selectedItemId) {
                            const pricingList = await getSalesPricingByStockId(row.selectedItemId);
                            const itemData = await getItemById(row.selectedItemId).catch(() => null);
                            const { priceAfterTax, priceBeforeTax } = resolveSalesItemLinePrices({
                                pricingList,
                                stockId: String(row.selectedItemId),
                                salesTypeId: priceList,
                                salesTypes: priceLists,
                                currencyCode: customerCurrency,
                                homeCurrencyCode,
                                materialCost: Number(itemData?.material_cost ?? row.materialCost ?? 0),
                            });
                            const priceToUse = selectedPriceList?.taxIncl ? priceAfterTax : priceBeforeTax;
                            const total = row.quantity * priceToUse * (1 - row.discount / 100);
                            return {
                                ...row,
                                priceAfterTax,
                                priceBeforeTax,
                                total: total,
                            };
                        }
                        return row;
                    })
                );
                try {
                    const same = JSON.stringify(newRows) === JSON.stringify(rows);
                    if (!same) setRows(newRows);
                } catch (e) {
                    setRows(newRows);
                }
            };
            updatePrices();
        }
    }, [priceList, customerCurrency, homeCurrencyCode]);

    // Update available quantities when deliverFrom location changes
    useEffect(() => {
        const updateAvailableQuantities = async () => {
            if (deliverFrom) {
                try {
                    const stockMoves = await getStockMoves();
                    const updatedRows = await Promise.all(
                        rows.map(async (row) => {
                            if (row.selectedItemId) {
                                const relevantMoves = stockMoves.filter((move: any) =>
                                    String(move.loc_code) === String(deliverFrom) &&
                                    String(move.stock_id) === String(row.selectedItemId)
                                );
                                const availableQty = relevantMoves.reduce((sum: number, move: any) => sum + (move.qty || 0), 0);
                                return { ...row, availableQuantity: availableQty };
                            }
                            return row;
                        })
                    );
                    setRows(updatedRows);
                } catch (error) {
                    console.error("Error updating available quantities:", error);
                    setRows(rows.map(row => ({ ...row, availableQuantity: 0 })));
                }
            } else {
                setRows(rows.map(row => ({ ...row, availableQuantity: 0 })));
            }
        };

        updateAvailableQuantities();
    }, [deliverFrom]);

    // Update credit, discount, payment and priceList when customer changes (guarded updates)
    useEffect(() => {
        if (customer) {
            const selectedCustomer = customers.find((c: any) => String(c.debtor_no) === String(customer));
            if (selectedCustomer) {
                const newDiscount = selectedCustomer.discount || 0;
                let newPayment = customerPaymentTermId(selectedCustomer);
                const newPriceList = customerSalesTypeId(selectedCustomer);

                if (newPayment) {
                    const ptObj = paymentTerms.find((pt: any) => String(pt.terms_indicator) === String(newPayment));
                    if (ptObj) {
                        const pType = ptObj.payment_type;
                        const id = typeof pType === 'number' ? pType : (pType?.id ?? pType?.payment_type ?? null);
                        if (Number(id) === 1) {
                            newPayment = "";
                        }
                    }
                }

                if (newDiscount !== discount) setDiscount(newDiscount);
                if (newPayment !== payment) setPayment(newPayment);
                if (newPriceList !== priceList) setPriceList(newPriceList);
                setRows((prev) => {
                    const updated = prev.map((r) => ({ ...r, discount: newDiscount }));
                    try {
                        const same = JSON.stringify(updated) === JSON.stringify(prev);
                        return same ? prev : updated;
                    } catch (e) {
                        return updated;
                    }
                });
            }
        } else {
            if (discount !== 0) setDiscount(0);
            if (payment !== "") setPayment("");
            if (priceList !== "") setPriceList("");
            setRows((prev) => {
                const updated = prev.map((r) => ({ ...r, discount: 0 }));
                try {
                    const same = JSON.stringify(updated) === JSON.stringify(prev);
                    return same ? prev : updated;
                } catch (e) {
                    return updated;
                }
            });
        }
    }, [customer, customers, paymentTerms]);

    const [submitting, setSubmitting] = useState(false);

    // Helper to get selected customer object
    const customerName = selectedCustomer?.name || null;
    const customerPhone = selectedCustomer?.phone || selectedCustomer?.contact_phone || null;
    const customerEmail = selectedCustomer?.email || selectedCustomer?.contact_email || null;
    const customerAddr = selectedCustomer?.address || selectedCustomer?.delivery_address || address || null;

    // If the customer has no branch yet, silently create a default "Main Branch"
    // for them (same defaults Add Customer uses) instead of blocking the invoice.
    const ensureCustomerBranch = async (): Promise<string> => {
        if (branch) return branch;

        const customerBranches = branches.filter((b: any) => String(b.debtor_no) === String(customer));
        if (customerBranches.length > 0) {
            const defaultBranch = customerBranches.find((b: any) => !b.inactive) || customerBranches[0];
            const branchCode = String(defaultBranch.branch_code);
            setBranch(branchCode);
            return branchCode;
        }

        const sysPrefs = await getSysPrefs();
        const getPref = (name: string) => sysPrefs.find((p: any) => p.name === name)?.value || "";

        const newBranch = await createBranch({
            debtor_no: Number(customer),
            br_name: `${customerName || "Customer"} Main Branch`,
            branch_ref: selectedCustomer?.debtor_ref || String(customer),
            br_address: customerAddr || customerName || "",
            phone: customerPhone || "",
            email: customerEmail || "",
            sales_account: getPref("salesAccount"),
            sales_discount_account: getPref("salesDiscountAccount"),
            receivables_account: getPref("receivableAccount"),
            payment_discount_account: getPref("promptPaymentDiscountAccount"),
            contact_person: customerName || "",
            inactive: false,
        });

        await queryClient.invalidateQueries({ queryKey: ["branches"] });
        const branchCode = String((newBranch as any)?.branch_code ?? (newBranch as any)?.branchCode ?? "");
        setBranch(branchCode);
        return branchCode;
    };

    const handlePlaceQuotation = async () => {
        if (!customer) { enqueueSnackbar("Select customer first", { variant: "warning" }); return; }
        let effectiveBranch = branch;
        try {
            effectiveBranch = await ensureCustomerBranch();
        } catch (branchErr) {
            console.error("Failed to auto-create customer branch", branchErr);
            enqueueSnackbar(
                "Could not create a branch for this customer automatically. Please add one manually.",
                { variant: "error", autoHideDuration: 8000 }
            );
            return;
        }
        if (!effectiveBranch) { enqueueSnackbar("Select branch first", { variant: "warning" }); return; }
        if (!deliverFrom) { enqueueSnackbar("Select deliver-from location", { variant: "warning" }); return; }
        if (!priceList) { enqueueSnackbar("Please select a price list.", { variant: "warning" }); return; }
        const orderTypeId = Number(relationId(priceList, "id"));
        if (!orderTypeId || !priceLists.some((pl: any) => Number(pl.id) === orderTypeId)) {
            enqueueSnackbar("Please select a valid price list.", { variant: "warning" });
            return;
        }
        const isCashSale = isCashSalePaymentTerm(paymentTerms, payment);
        const isAdvanceBalance = isAdvanceBalancePaymentTerm(paymentTerms, payment);
        if (isCashSale && !cashAccount) { enqueueSnackbar("Select cash account", { variant: "warning" }); return; }
        const lineRows = rows.filter((r) => r.itemCode && r.quantity > 0);
        if (lineRows.length === 0) {
            enqueueSnackbar("At least one item must be added to the invoice.", { variant: "warning" });
            return;
        }

        const invoiceNetPreview = selectedPriceList?.taxIncl
            ? subTotal - totalTaxAmount
            : subTotal;
        const invoiceTotalPreview =
            invoiceNetPreview + totalTaxAmount + (shippingCharge || 0);

        const advanceAmountNum = Number(advanceAmount) || 0;
        if (isAdvanceBalance) {
            if (advanceAmountNum <= 0) {
                enqueueSnackbar("Enter the advance amount received.", { variant: "warning" });
                return;
            }
            if (advanceAmountNum > invoiceTotalPreview + 0.001) {
                enqueueSnackbar("Advance amount cannot exceed the invoice total.", { variant: "warning" });
                return;
            }
            if (!cashAccount) { enqueueSnackbar("Select cash/bank account for the advance", { variant: "warning" }); return; }
        }

        const creditCheckAmount = isAdvanceBalance
            ? Math.max(0, invoiceTotalPreview - advanceAmountNum)
            : invoiceTotalPreview;
        const creditError = validateCustomerCreditForSale({
            summary: creditSummary,
            documentTotal: creditCheckAmount,
            skipCreditCheck: isCashSale,
        });
        if (creditError) {
            enqueueSnackbar(creditError, { variant: "error", autoHideDuration: 8000 });
            return;
        }

        setSubmitting(true);
        try {
            const defaultShipperId = shippingCompanies.length > 0 ? shippingCompanies[0].shipper_id : 1;
            const shipViaId = Number(relationId(shippingCompany, "shipper_id", "id")) || Number(defaultShipperId) || 1;
            const paymentTermsId = payment
                ? Number(relationId(payment, "terms_indicator", "id")) || null
                : null;
            const stockLoc =
                relationId(deliverFrom, "loc_code", "code").slice(0, 5)
                || String(deliverFrom || "").slice(0, 5);
            const unitPriceFor = (row: any) =>
                priceColumnLabel === "Price after Tax" ? row.priceAfterTax : row.priceBeforeTax;
            const advanceAmountFinal = isAdvanceBalance ? advanceAmountNum : 0;

            const result = await createInternalServiceInvoice({
                debtor_no: Number(customer),
                branch_code: Number(effectiveBranch),
                tran_date: invoiceDate,
                due_date: invoiceDate,
                order_type: orderTypeId,
                ship_via: shipViaId,
                payment_terms: paymentTermsId,
                freight_cost: shippingCharge || 0,
                from_stk_loc: stockLoc || undefined,
                customer_ref: customerReference || undefined,
                cost_center_id: Number(costCenter) || undefined,
                delivery_address: customerAddr || undefined,
                deliver_to: customerName || undefined,
                comments: comments || undefined,
                reference: reference || nextInvoiceReference || undefined,
                cash_sale: isCashSale,
                advance_amount: advanceAmountFinal || undefined,
                bank_account_id: (isCashSale || advanceAmountFinal > 0) ? Number(cashAccount) || null : null,
                lines: lineRows.map((row) => ({
                    stock_id: row.itemCode,
                    quantity: Number(row.quantity),
                    unit_price: Number(unitPriceFor(row)),
                    discount_percent: Number(row.discount) || 0,
                    description: row.description,
                })),
            });

            setOpen(true);
            navigate("/sales/transactions/internal-service-invoice/success", {
                state: {
                    id: result.id,
                    reference: result.reference ?? reference,
                    invoiceDate,
                },
            });
        } catch (e: any) {
            console.error("Save error", e);
            const respData = e?.data ?? e?.response?.data;
            console.error("Save error response data:", respData);
            let detail = e?.statusText || e?.message || "Unknown error";
            if (respData) {
                if (typeof respData === "object") {
                    let msg = respData.message || "";
                    if (respData.error) msg += `: ${respData.error}`;
                    if (respData.errors) msg += `\nErrors:\n${JSON.stringify(respData.errors, null, 2)}`;
                    detail = msg || JSON.stringify(respData, null, 2);
                } else {
                    detail = String(respData);
                }
            } else if (e?.status === 422) {
                detail = "Validation failed. Check location, price list, shipping, and customer email.";
            }
            enqueueSnackbar("Failed to save: " + detail, { variant: "error", autoHideDuration: 8000 });
        } finally {
            setSubmitting(false);
        }
    };

    const breadcrumbItems = [
        { title: "Transactions", href: "/sales/transactions/" },
        { title: "Internal Service Invoice" },
    ];

    // Only calculate subtotal for completed rows (all rows except the last one which is being edited)
    const subTotal = rows.slice(0, -1).reduce((sum, r) => sum + r.total, 0);

    // Calculate taxes if taxIncl is true
    const selectedPriceList = useMemo(() => {
        return priceLists.find((pl: any) => String(pl.id) === String(priceList));
    }, [priceList, priceLists]);

    const taxCalculations = useMemo(() => {
        if (taxGroupItems.length === 0) {
            return [];
        }

        return taxGroupItems.map((item: any) => {
            const taxTypeData = taxTypes.find((t: any) => t.id === item.tax_type_id);
            const taxRate = taxTypeData?.default_rate || 0;
            const taxName = taxTypeData?.description || "Tax";

            let taxAmount = 0;
            if (selectedPriceList?.taxIncl) {
                taxAmount = subTotal - (subTotal / (1 + taxRate / 100));
            } else {
                taxAmount = subTotal * (taxRate / 100);
            }

            return {
                name: taxName,
                rate: taxRate,
                amount: taxAmount,
                tax_type_id: item.tax_type_id,
            };
        });
    }, [selectedPriceList, taxGroupItems, taxTypes, subTotal]);

    const totalTaxAmount = taxCalculations.reduce((sum, tax) => sum + tax.amount, 0);

    const documentTotal =
        subTotal + shippingCharge + (selectedPriceList?.taxIncl ? 0 : totalTaxAmount);

    const { summary: creditSummary, isLoading: creditLoading } = useCustomerCredit(
        customer || null,
        customers
    );

    // Only show payment terms where payment_type != 1
    const visiblePaymentTerms = useMemo(() => {
        return paymentTerms.filter((pt: any) => {
            const pType = pt.payment_type;
            const id = typeof pType === "number" ? pType : (pType?.id ?? pType?.payment_type ?? null);
            return Number(id) !== 1;
        });
    }, [paymentTerms]);

    return (
        <FormPageLayout>
            {/* Header */}
            <Box
                sx={{
                    padding: theme.spacing(2),
                    boxShadow: 2,
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Box>
                    <PageTitle title="Internal Service Invoice" />
                    <Breadcrumb breadcrumbs={breadcrumbItems} />
                </Box>

                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
                    Back
                </Button>
            </Box>
            {/* Form fields */}
            <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <Stack spacing={2}>
                            <TextField
                                select
                                fullWidth
                                label="Customer"
                                value={String(customer || "")}
                                onChange={(e) => setCustomer(e.target.value)}
                                size="small"
                            >
                                {customers.map((c: any) => (
                                    <MenuItem key={c.debtor_no} value={String(c.debtor_no)}>
                                        {c.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                fullWidth
                                label="Branch"
                                value={String(branch || "")}
                                onChange={(e) => setBranch(e.target.value)}
                                size="small"
                            >
                                {branches
                                    .filter((b: any) => String(b.debtor_no) === String(customer))
                                    .map((b: any) => (
                                        <MenuItem key={b.branch_code} value={String(b.branch_code)}>
                                            {b.br_name}
                                        </MenuItem>
                                    ))}
                            </TextField>
                            <CustomerCurrencyField customer={selectedCustomer} />
                            <TextField
                                label="Reference"
                                fullWidth
                                size="small"
                                value={reference}
                                InputProps={{ readOnly: true }}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Stack spacing={2}>
                            <CustomerCreditSummaryFields
                                summary={creditSummary}
                                documentTotal={documentTotal}
                                isLoading={creditLoading}
                                currencyCode={customerCurrency}
                            />
                            <TextField label="Customer Discount (%)" fullWidth size="small" value={discount} InputProps={{ readOnly: true }} />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Stack spacing={2}>
                            <TextField
                                select
                                fullWidth
                                label="Payment Type"
                                value={String(payment || "")}
                                onChange={(e) => setPayment(e.target.value)}
                                size="small"
                                SelectProps={{
                                    renderValue: (selected) => {
                                        const sel = visiblePaymentTerms.find((pt: any) => String(pt.terms_indicator) === String(selected));
                                        return sel ? sel.description : (selected as string);
                                    },
                                }}
                            >
                                {visiblePaymentTerms.map((p: any) => (
                                    <MenuItem key={p.terms_indicator} value={String(p.terms_indicator)}>
                                        {p.description}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                fullWidth
                                label="Price List"
                                value={String(priceList || "")}
                                onChange={(e) => setPriceList(e.target.value)}
                                size="small"
                            >
                                {priceLists.map((pl: any) => (
                                    <MenuItem key={pl.id} value={String(pl.id)}>
                                        {pl.typeName}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Stack spacing={2}>
                            <TextField
                                label="Invoice Date"
                                type="date"
                                fullWidth
                                size="small"
                                value={invoiceDate}
                                onChange={(e) => handleDateChange(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: selectedFiscalYear ? new Date(selectedFiscalYear.fiscal_year_from).toISOString().split('T')[0] : undefined,
                                    max: selectedFiscalYear ? new Date(selectedFiscalYear.fiscal_year_to).toISOString().split('T')[0] : undefined,
                                }}
                                error={!!dateError}
                                helperText={dateError}
                            />
                            <TextField
                                select
                                fullWidth
                                label="Cost Center"
                                value={costCenter}
                                onChange={(e) => setCostCenter(e.target.value)}
                                size="small"
                            >
                                <MenuItem value="">None</MenuItem>
                                {costCenters.map((cc: any) => (
                                    <MenuItem key={cc.id} value={cc.id}>
                                        {cc.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>
            {/* Items Table */}
            <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>Sales Invoice Items</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                        <TableRow>
                            <TableCell>No</TableCell>
                            <TableCell>Item Code</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Unit</TableCell>
                            <TableCell>{priceColumnLabel}</TableCell>
                            <TableCell>Discount (%)</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.map((row, i) => (
                            <TableRow key={row.id} data-row-id={row.id}>
                                <TableCell>{i + 1}</TableCell>
                                <TableCell>
                                    <ItemSearchSelect
                                        displayField="code"
                                        hideLabel
                                        selectedStockId={String(row.selectedItemId ?? row.itemCode ?? "")}
                                        value={row.description}
                                        items={items as any[]}
                                        categories={categories.map((c: any) => ({
                                            id: c.category_id,
                                            category_name: c.description,
                                        }))}
                                        onSelect={(selected) => {
                                            if (selected) {
                                                handleItemChange(row.id, selected);
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <ItemSearchSelect
                                        hideLabel
                                        value={row.description}
                                        selectedStockId={String(row.selectedItemId ?? row.itemCode ?? "")}
                                        items={items as any[]}
                                        categories={categories.map((c: any) => ({
                                            id: c.category_id,
                                            category_name: c.description,
                                        }))}
                                        onSelect={(selected) => {
                                            if (selected) {
                                                handleItemChange(row.id, selected);
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormattedNumberField
                                        size="small"
                                        value={row.quantity}
                                        onChange={(e) => {
                                            const inputValue = Number(e.target.value);
                                            handleChange(row.id, "quantity", inputValue);
                                        }}
                                        inputProps={{ min: 0 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField size="small" value={row.unit} InputProps={{ readOnly: true }} />
                                </TableCell>
                                <TableCell align="right">
                                    <CurrencyAmountInput
                                        value={priceColumnLabel === "Price before Tax" ? row.priceBeforeTax : row.priceAfterTax}
                                        currencyCode={customerCurrency}
                                        onChange={(v) => handleChange(row.id, priceColumnLabel === "Price before Tax" ? "priceBeforeTax" : "priceAfterTax", v)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormattedNumberField
                                        size="small"
                                        value={row.discount}
                                        InputProps={{ readOnly: true }}
                                    />
                                </TableCell>
                                <TableCell>{formatMoney(row.total)}</TableCell>
                                <TableCell>
                                    {i === rows.length - 1 ? (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={handleAddRow}
                                        >
                                            Add
                                        </Button>
                                    ) : (
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<EditIcon />}
                                                onClick={() => {
                                                    const rowElement = document.querySelector(`[data-row-id="${row.id}"]`);
                                                    if (rowElement) {
                                                        const firstInput = rowElement.querySelector('input') as HTMLInputElement;
                                                        if (firstInput) firstInput.focus();
                                                    }
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleRemoveRow(row.id)}
                                            >
                                                Delete
                                            </Button>
                                        </Stack>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>

                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={7}>Shipping Charge</TableCell>
                            <TableCell>
                                <FormattedNumberField
                                    size="small"
                                    value={shippingCharge}
                                    onChange={(e) => setShippingCharge(Number(e.target.value))}
                                />
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell colSpan={7} sx={{ fontWeight: 600 }}>Sub-total</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{formatMoney(subTotal)}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>

                        {taxCalculations.length > 0 && (
                            <>
                                <TableRow>
                                    <TableCell colSpan={9} sx={{ fontWeight: 600, fontStyle: 'italic', color: 'text.secondary' }}>
                                        {selectedPriceList?.taxIncl ? "Taxes Included:" : "Taxes:"}
                                    </TableCell>
                                </TableRow>
                                {taxCalculations.map((tax, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell colSpan={7} sx={{ pl: 4 }}>
                                            {tax.name} ({tax.rate}%)
                                        </TableCell>
                                        <TableCell>{formatMoney(tax.amount)}</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                ))}
                            </>
                        )}

                        <TableRow>
                            <TableCell colSpan={7} sx={{ fontWeight: 600 }}>Amount Total</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                                {formatMoney(subTotal + shippingCharge + (selectedPriceList?.taxIncl ? 0 : totalTaxAmount))}
                            </TableCell>
                            <TableCell>
                                <Button variant="contained" size="small">
                                    Update
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>
            {/* Cash Payment / Advance Payment Section */}
            <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>
                    {isAdvanceBalancePaymentTerm(paymentTerms, payment) ? "Advance Payment" : "Cash Payment"}
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            fullWidth
                            label="Deliver From Location"
                            value={String(deliverFrom || "")}
                            onChange={(e) => setDeliverFrom(e.target.value)}
                            size="small"
                        >
                            {locations.map((loc: any) => (
                                <MenuItem key={loc.loc_code} value={String(loc.loc_code)}>
                                    {loc.location_name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            fullWidth
                            label="Cash Account"
                            value={String(cashAccount || "")}
                            onChange={(e) => setCashAccount(e.target.value)}
                            size="small"
                            SelectProps={{
                                renderValue: (selected) => {
                                    if (!selected) return "Select";
                                    const acc = cashBankAccounts.find(
                                        (a: any) => String(a.id) === String(selected)
                                    );
                                    return acc ? bankAccountLabel(acc) : String(selected);
                                },
                            }}
                            helperText={
                                cashBankAccounts.length === 0
                                    ? "No bank accounts found — add one under Banking maintenance."
                                    : selectedCashBankAccount
                                        ? undefined
                                        : cashAccount
                                            ? "Selected account is not in the list."
                                            : undefined
                            }
                        >
                            <MenuItem value="">Select</MenuItem>
                            {cashBankAccounts.map((acc: any) => (
                                <MenuItem key={acc.id} value={String(acc.id)}>
                                    {bankAccountLabel(acc)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {isAdvanceBalancePaymentTerm(paymentTerms, payment) && (
                        <>
                            <Grid item xs={12} sm={6}>
                                <FormattedNumberField
                                    label="Advance Received"
                                    name="advanceAmount"
                                    size="small"
                                    fullWidth
                                    value={advanceAmount}
                                    onChange={(e) => setAdvanceAmount(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Balance Due"
                                    value={formatMoney(Math.max(0, documentTotal - (Number(advanceAmount) || 0)))}
                                    InputProps={{ readOnly: true }}
                                />
                            </Grid>
                        </>
                    )}

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Comments"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 2 }}>
                    <Button variant="outlined" onClick={() => navigate(-1)}>
                        Cancel Invoice
                    </Button>
                    <Button variant="contained" color="primary" onClick={handlePlaceQuotation} disabled={!!dateError || submitting}>
                        {submitting ? "Saving..." : "Place Invoice"}
                    </Button>
                </Box>
            </Paper>
            <AddedConfirmationModal
                open={open}
                title="Success"
                content="Internal Service Invoice has been added successfully!"
                addFunc={async () => { }}
                handleClose={() => setOpen(false)}
                onSuccess={() => {
                    window.history.back();
                }}
            />
        </FormPageLayout>
    );
}
