import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useState, useMemo } from "react";
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
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Checkbox,
  FormControlLabel,
  TableFooter,
  TablePagination,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSuppliers } from "../../../../api/Supplier/SupplierApi";
import { getSupplierAllocationsInquiry } from "../../../../api/Purchases/PurchasesApi";
import { getTransTypes } from "../../../../api/Reflines/TransTypesApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import { formatTransactionMoney } from "../../../../utils/transactionMoney";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";

function formatDate(val: unknown): string {
  if (!val) return "";
  const s = String(val);
  return s.includes("T") ? s.split("T")[0] : s.split(" ")[0];
}

export default function SupplierAllocations() {
  const navigate = useNavigate();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });
  const { data: transTypes = [] } = useQuery({
    queryKey: ["transTypes"],
    queryFn: getTransTypes,
  });

  const [selectedSupplier, setSelectedSupplier] = useState("ALL_SUPPLIERS");
  const [showSettled, setShowSettled] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(-1);

  const inquiryParams = useMemo(
    () => ({
      ...(!showSettled ? { settled: "no" as const } : {}),
      ...(selectedSupplier !== "ALL_SUPPLIERS"
        ? { supplier_id: Number(selectedSupplier) }
        : {}),
      limit: 500,
    }),
    [selectedSupplier, showSettled]
  );

  const { data: suppTrans = [], isLoading } = useQuery({
    queryKey: ["supplierAllocationInquiry", inquiryParams],
    queryFn: () => getSupplierAllocationsInquiry(inquiryParams),
  });

  const rows = useMemo(() => {
    const supMap = new Map(
      (suppliers || []).map((s: any) => [
        String(s.supplier_id ?? s.id ?? s.supp_id),
        s,
      ])
    );
    const transTypeMap = new Map(
      (transTypes || []).map((t: any) => [String(t.trans_type), t])
    );

    const data = Array.isArray(suppTrans) ? suppTrans : [];
    const allowedTypes = showSettled ? [20, 21, 22] : [21, 22];

    const toRow = (t: any) => {
      const supId = String(t.supplier_id ?? t.supplier ?? t.supp_id ?? "");
      const sup = supMap.get(supId) as any;
      const transTypeId = Number(t.trans_type ?? t.type ?? 0);
      const transType = transTypeMap.get(String(transTypeId)) as any;
      const transNo = t.trans_no ?? t.id ?? "";
      const absTotal = Math.abs(Number(t.document_total ?? 0));
      const left = Math.max(0, Number(t.balance ?? 0));
      const reference = String(t.reference ?? "").trim();

      return {
        id: `${transTypeId}-${transNo}`,
        type:
          transType?.description ??
          transType?.name ??
          (transTypeId === 20
            ? "Supplier Invoice"
            : transTypeId === 21
              ? "Supplier Credit Note"
              : "Supplier Payment"),
        transType: transTypeId,
        transNo,
        transData: t,
        number: String(transNo),
        reference,
        date: formatDate(t.trans_date ?? t.date),
        dueDate: formatDate(t.due_date),
        supplier: String(t.supplier_name ?? sup?.supp_name ?? sup?.name ?? "-"),
        supplierId: supId,
        currency: String(sup?.curr_code ?? t.curr_code ?? "-"),
        total: absTotal,
        left,
        settled: left < 0.01,
      };
    };

    const filtered = data.filter((t: any) => {
      const type = Number(t.trans_type ?? t.type ?? 0);
      if (!allowedTypes.includes(type)) return false;
      if (
        selectedSupplier !== "ALL_SUPPLIERS" &&
        String(t.supplier_id ?? t.supplier ?? "") !== String(selectedSupplier)
      ) {
        return false;
      }
      return true;
    });

    const mapped = filtered.map(toRow);
    const type20 = mapped.filter((r) => r.transType === 20);
    const type21 = mapped.filter((r) => r.transType === 21);
    const type22 = mapped.filter((r) => r.transType === 22);

    return [...type20, ...type21, ...type22];
  }, [suppTrans, suppliers, transTypes, selectedSupplier, showSettled]);

  const paginatedRows = useMemo(() => {
    if (rowsPerPage === -1) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const settledCount = rows.filter((r) => r.settled).length;
  const openCount = rows.length - settledCount;

  return (
    <FormPageLayout>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <PageTitle title="Supplier Allocations" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Purchases", href: "/purchase/transactions" },
              { title: "Transactions", href: "/purchase/transactions" },
              { title: "Supplier Allocations" },
            ]}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isLoading
              ? "Loading…"
              : `${rows.length} record(s) — ${openCount} open, ${settledCount} settled`}
            {showSettled
              ? " (includes fully paid supplier invoices)"
              : " (payments and credit notes with balance left)"}
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          <FormControl sx={{ minWidth: 250 }} size="small">
            <InputLabel>Select Supplier</InputLabel>
            <Select
              value={selectedSupplier}
              label="Select Supplier"
              onChange={(e) => {
                setSelectedSupplier(String(e.target.value));
                setPage(0);
              }}
            >
              <MenuItem value="ALL_SUPPLIERS">All Suppliers</MenuItem>
              {(suppliers || []).map((s: any) => (
                <MenuItem
                  key={s.supplier_id ?? s.id}
                  value={String(s.supplier_id ?? s.id)}
                >
                  {s.supp_name ?? s.name ?? s.supplier_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={showSettled}
                onChange={(e) => {
                  setShowSettled(e.target.checked);
                  setPage(0);
                }}
              />
            }
            label="Show Settled Items"
          />

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/purchase/transactions")}
          >
            Back
          </Button>
        </Stack>
      </Box>
      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>Transaction Type</TableCell>
              <TableCell>#</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Left to Allocate</TableCell>
              {showSettled && <TableCell align="center">Status</TableCell>}
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={showSettled ? 11 : 10} align="center">
                  Loading supplier allocations…
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showSettled ? 11 : 10} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No records found.
                    {!showSettled
                      ? " Enable “Show Settled Items” to include fully paid invoices and settled payments."
                      : ""}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  sx={r.settled ? { backgroundColor: "action.hover" } : undefined}
                >
                  <TableCell>{r.type}</TableCell>
                  <TableCell>
                    {r.transType === 21 ? (
                      <Button
                        variant="text"
                        size="small"
                        sx={{ textDecoration: "underline", textTransform: "none" }}
                        onClick={() =>
                          navigate(
                            "/purchase/transactions/supplier-credit-notes/view-supplier-credit-note",
                            {
                              state: {
                                transNo: r.transNo,
                                transType: r.transType,
                                supplier: r.supplierId,
                                reference: r.reference,
                                supplierRef: r.transData?.supp_reference ?? "",
                                date: r.date,
                                dueDate: r.dueDate,
                                fromAllocations: true,
                              },
                            }
                          )
                        }
                      >
                        {r.number}
                      </Button>
                    ) : r.transType === 22 ? (
                      <Button
                        variant="text"
                        size="small"
                        sx={{ textDecoration: "underline", textTransform: "none" }}
                        onClick={() =>
                          navigate(
                            "/purchase/transactions/payment-to-suppliers/view-supplier-payment",
                            {
                              state: {
                                transNo: r.transNo,
                                transType: r.transType,
                                supplier: r.supplierId,
                                reference: r.reference,
                                datePaid: r.date,
                                amount: r.total,
                                fromAllocations: true,
                              },
                            }
                          )
                        }
                      >
                        {r.number}
                      </Button>
                    ) : (
                      <Button
                        variant="text"
                        size="small"
                        sx={{ textDecoration: "underline", textTransform: "none" }}
                        onClick={() =>
                          navigate(
                            "/purchase/transactions/supplier-invoice/view-supplier-invoice",
                            {
                              state: {
                                transNo: r.transNo,
                                transType: 20,
                                supplier: r.supplierId,
                                reference: r.reference,
                                supplierRef: r.transData?.supp_reference ?? "",
                                invoiceDate: r.date,
                                dueDate: r.dueDate,
                                fromInquiry: true,
                              },
                            }
                          )
                        }
                      >
                        {r.number}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>{r.reference}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.dueDate}</TableCell>
                  <TableCell>{r.supplier}</TableCell>
                  <TableCell>{r.currency}</TableCell>
                  <TableCell align="right">{formatTransactionMoney(r.total, r.currency)}</TableCell>
                  <TableCell align="right">{formatTransactionMoney(r.left, r.currency)}</TableCell>
                  {showSettled && (
                    <TableCell align="center">
                      <Typography
                        variant="caption"
                        color={r.settled ? "success.main" : "warning.main"}
                        fontWeight={600}
                      >
                        {r.settled ? "Settled" : "Open"}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="center">
                    {r.transType === 20 && r.left > 0.001 && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          navigate("/purchase/transactions/payment-to-suppliers", {
                            state: { supplier: r.supplierId },
                          })
                        }
                      >
                        Payment
                      </Button>
                    )}
                    {(r.transType === 21 || r.transType === 22) && r.left > 0.001 && (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() =>
                          navigate(
                            "/purchase/transactions/allocate-supplier-payments-credit-notes/view-supplier-allocations",
                            { state: { transNo: r.transNo, transType: r.transType } }
                          )
                        }
                      >
                        Allocate
                      </Button>
                    )}
                    {r.settled && (
                      <Typography variant="caption" color="text.secondary">
                        Settled
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, { label: "All", value: -1 }]}
                colSpan={showSettled ? 11 : 10}
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                showFirstButton
                showLastButton
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </FormPageLayout>
  );
}
