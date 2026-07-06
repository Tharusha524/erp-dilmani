import React, { useState, useEffect, useMemo } from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWorkOrders } from "../../../../api/WorkOrders/WorkOrderApi";
import { getBoms } from "../../../../api/Bom/BomApi";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getJournals } from "../../../../api/Journals/JournalApi";
import { getWOCostings } from "../../../../api/WorkOrders/WOCostingApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getWorkCentres } from "../../../../api/WorkCentre/WorkCentreApi";
import { getStockMoves } from "../../../../api/StockMoves/StockMovesApi";
import { getWoManufacturesByWorkOrder } from "../../../../api/WorkOrders/WOManufactureApi";
import { TransactionPrintPage, TransactionPrintTemplate } from "../../../../components/Print";
import {
  DOCUMENT_PRINT_TYPES,
  WORK_ORDER_REQUIREMENT_PRINT_COLUMNS,
} from "../../../../utils/transactionPrintColumns";
import { formatPrintDate } from "../../../../utils/formatPrintDocument";

export default function ViewWorkOrderEntry() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { reference, id, autoPrint = false } = state || {};

  const [workOrder, setWorkOrder] = useState<any | null>(null);
  const [workOrderRequirements, setWorkOrderRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: locations = [] } = useQuery({ queryKey: ["inventoryLocations"], queryFn: getInventoryLocations });
  const { data: journals = [], refetch: refetchJournals } = useQuery({ queryKey: ["journals"], queryFn: getJournals });
  const { data: woCostings = [], refetch: refetchWOCostings } = useQuery({ queryKey: ["woCostings"], queryFn: getWOCostings });
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: getItems });
  const { data: workCentres = [] } = useQuery({ queryKey: ["workCentres"], queryFn: getWorkCentres });
  const { data: stockMoves = [], refetch: refetchStockMoves } = useQuery({ queryKey: ["stockMoves"], queryFn: getStockMoves });
  const { data: woManufactures = [] } = useQuery({
    queryKey: ["woManufactures", workOrder?.id],
    queryFn: () => getWoManufacturesByWorkOrder(Number(workOrder?.id)),
    enabled: !!workOrder?.id,
  });

  const costsForWorkOrder = useMemo(() => {
    if (!workOrder || !Array.isArray(woCostings)) return [];
    const woId = String(workOrder.id ?? workOrder.wo_id ?? workOrder.wo_id ?? "");
    const matched = woCostings.filter((c: any) => {
      const cid = String(c.wo_id ?? c.workorder_id ?? c.work_order_id ?? c.woId ?? "");
      return cid === woId;
    });
    return matched.map((c: any) => {
      const transNo = c.trans_no ?? c.transno ?? c.transno_id ?? c.transNo ?? c.journal_trans_no ?? "";
      const journal = Array.isArray(journals) ? journals.find((j: any) => String(j.trans_no ?? j.transno ?? j.tran_no) === String(transNo)) : null;
      const journalAmount = journal?.amount ?? journal?.total ?? journal?.value ?? journal?.credit ?? journal?.debit ?? null;
      return {
        id: c.id ?? `${transNo}_${c.cost_type}`,
        type: Number(c.cost_type) === 0 ? "Labour" : Number(c.cost_type) === 1 ? "Overhead" : String(c.cost_type),
        date: journal?.tran_date ?? c.date ?? c.created_at ?? "",
        transNo: transNo,
        amount: journalAmount ?? c.amount ?? c.value ?? c.cost ?? 0,
      };
    });
  }, [workOrder, woCostings, journals]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await getWorkOrders();
        if (!Array.isArray(all)) {
          setWorkOrder(null);
          setWorkOrderRequirements([]);
          return;
        }

        let found = null;
        if (id) found = all.find((w: any) => String(w.id) === String(id) || String(w.wo_id ?? w.id) === String(id));
        if (!found && reference) found = all.find((w: any) => String(w.wo_ref ?? w.reference) === String(reference));

        if (found) {
          setWorkOrder(found);
            // Immediately refetch related lists so recent async creations appear
            try { refetchJournals && refetchJournals(); } catch (e) {}
            try { refetchWOCostings && refetchWOCostings(); } catch (e) {}
            try { refetchStockMoves && refetchStockMoves(); } catch (e) {}
            // Delayed retry in case background writes complete shortly after navigation
            setTimeout(() => { try { refetchJournals && refetchJournals(); } catch (e) {} }, 1000);
            setTimeout(() => { try { refetchWOCostings && refetchWOCostings(); } catch (e) {} }, 1200);
            setTimeout(() => { try { refetchStockMoves && refetchStockMoves(); } catch (e) {} }, 1400);
          // prefer to show BOM-derived requirements for the manufactured item
          try {
            const parentCode = String(found.stock_id ?? found.stock_code ?? found.item_name ?? "");
            if (parentCode) {
              const allBoms = await getBoms();
              const matches = Array.isArray(allBoms) ? allBoms.filter((b: any) => String(b.parent) === parentCode) : [];
              const totalQty = Number(found.units_reqd ?? found.quantity ?? 0) || 0;
              const unitsIssued = Number(found.units_issued ?? found.unitsIssued ?? 0) || 0;
              const mapped = matches.map((bom: any) => ({
                component: bom.component ?? bom.component_stock_id ?? bom.component_id ?? "",
                fromLocation: bom.loc_code ?? bom.loccode ?? "",
                workCentre: bom.work_centre ?? bom.work_centre_id ?? "",
                unitQuantity: bom.quantity ?? bom.qty ?? 0,
                totalQuantity: totalQty,
                unitsIssued: unitsIssued,
                onHand: (() => {
                  try {
                    const compId = bom.component ?? bom.component_stock_id ?? bom.component_id ?? "";
                    const bomLoc = bom.loc_code ?? bom.loccode ?? bom.loc ?? "";
                    if (!compId) return "-";
                    const movesArr = Array.isArray(stockMoves) ? stockMoves : [];
                    const q = movesArr
                      .filter((m: any) => String(m.stock_id) === String(compId) && String(m.loc_code ?? m.loc ?? m.location) === String(bomLoc))
                      .reduce((s: number, m: any) => s + (Number(m.qty) || 0), 0);
                    return Number.isNaN(q) ? 0 : q;
                  } catch (e) {
                    return 0;
                  }
                })(),
              }));
              setWorkOrderRequirements(mapped);
            } else {
              const reqs = found.requirements || found.components || found.work_order_requirements || [];
              setWorkOrderRequirements(Array.isArray(reqs) ? reqs : []);
            }
          } catch (bomErr) {
            console.warn("Failed to load BOM for work order requirements:", bomErr);
            const reqs = found.requirements || found.components || found.work_order_requirements || [];
            setWorkOrderRequirements(Array.isArray(reqs) ? reqs : []);
          }
        } else {
          setWorkOrder(null);
          setWorkOrderRequirements([]);
        }
      } catch (err) {
        console.warn("Failed to load work order:", err);
        setWorkOrder(null);
        setWorkOrderRequirements([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, reference]);

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Work Order" },
  ];

  const getTypeLabel = (t: any) => {
    const n = Number(t);
    if (n === 0) return "Assemble";
    if (n === 1) return "Unassemble";
    if (n === 2) return "Advanced Manufacture";
    return String(t ?? "");
  };

  const getLocationName = (code: any) => {
    if (!code) return "-";
    // if workOrder already has location_name we prefer it elsewhere; this helper resolves codes
    const c = String(code);
    if (Array.isArray(locations) && locations.length > 0) {
      const found = locations.find((l: any) => String(l.loc_code ?? l.loccode ?? l.code ?? "") === c || String(l.location_name ?? "") === c);
      if (found) return found.location_name ?? c;
    }
    return c;
  };

  const getItemDescription = (stockId: any) => {
    if (!stockId) return "-";
    const id = String(stockId);
    if (Array.isArray(items) && items.length > 0) {
      const found = items.find((it: any) => String(it.stock_id ?? it.id ?? it.stock_master_id ?? it.item_id ?? "") === id || String(it.stock_code ?? it.stock_id ?? it.code ?? "") === id);
      if (found) return found.item_name ?? found.name ?? found.description ?? found.item_description ?? id;
    }
    return id;
  };

  const getWorkCentreName = (wcId: any) => {
    if (!wcId && wcId !== 0) return "-";
    const id = String(wcId);
    if (Array.isArray(workCentres) && workCentres.length > 0) {
      const found = workCentres.find((w: any) => String(w.id ?? w.work_centre_id ?? w.workCentreId ?? w.workcentre_id ?? "") === id || String(w.code ?? w.id ?? "") === id);
      if (found) return found.name ?? found.work_centre_name ?? found.description ?? id;
    }
    return id;
  };

  const printLines = useMemo(
    () =>
      workOrderRequirements.map((req: any) => ({
        item: String(req.component ?? req.stock_id ?? "—"),
        description: getItemDescription(
          req.component ?? req.stock_id ?? req.item_name ?? req.stock_master_id ?? req.item_id
        ),
        location: getLocationName(
          req.fromLocation ?? req.from_loc ?? req.location_name ?? req.loc_code ?? req.loc ?? req.loccode
        ),
        workCentre: getWorkCentreName(
          req.workCentre ?? req.work_centre ?? req.workcentre ?? req.work_centre_id ?? req.workCentreId
        ),
        quantity: String(req.unitQuantity ?? req.qty_per_unit ?? req.unit_quantity ?? "—"),
        total: String(req.totalQuantity ?? req.total_qty ?? "—"),
        issued: String(req.unitsIssued ?? req.issued ?? "—"),
      })),
    [workOrderRequirements, items, locations, workCentres]
  );

  const producedTotal = useMemo(
    () =>
      (Array.isArray(woManufactures) ? woManufactures : []).reduce(
        (s: number, r: any) => s + (Number(r.quantity ?? r.qty ?? 0) || 0),
        0
      ),
    [woManufactures]
  );

  return (
    <TransactionPrintPage
      pageTitle={`Work Order - ${workOrder?.wo_ref ?? reference ?? "—"}`}
      breadcrumbs={breadcrumbItems}
      onBack={() => navigate(-1)}
      autoPrint={Boolean(autoPrint)}
      ready={!loading && Boolean(workOrder)}
      printContent={
        <TransactionPrintTemplate
          documentType={DOCUMENT_PRINT_TYPES.workOrder}
          documentNumber={workOrder?.id}
          reference={workOrder?.wo_ref ?? workOrder?.reference ?? reference}
          documentDate={workOrder?.date ?? workOrder?.tran_date}
          documentFields={[
            { label: "Type", value: getTypeLabel(workOrder?.type) },
            {
              label: "Manufactured Item",
              value: getItemDescription(
                workOrder?.stock_id ?? workOrder?.stock_code ?? workOrder?.item_name
              ),
            },
            {
              label: "Into Location",
              value:
                workOrder?.location_name ??
                getLocationName(workOrder?.loc_code ?? workOrder?.loc ?? workOrder?.location),
            },
            {
              label: "Date",
              value: formatPrintDate(workOrder?.date ?? workOrder?.tran_date),
            },
            {
              label: "Quantity Required",
              value: String(workOrder?.units_reqd ?? workOrder?.quantity ?? "—"),
            },
            {
              label: "Units Issued",
              value: String(workOrder?.units_issued ?? workOrder?.unitsIssued ?? "—"),
            },
            { label: "Units Produced", value: String(producedTotal) },
          ]}
          columns={WORK_ORDER_REQUIREMENT_PRINT_COLUMNS}
          lines={printLines}
          totals={{
            total: Number(workOrder?.units_reqd ?? workOrder?.quantity ?? 0),
          }}
          footerNote="Work order — component requirements and issue status."
        />
      }
      screenExtras={
        <>
          {costsForWorkOrder.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Additional Costs
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {costsForWorkOrder.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.transNo ?? ""}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>{row.date ? String(row.date).split("T")[0] : ""}</TableCell>
                        <TableCell align="right">{row.amount ?? 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
          {Array.isArray(woManufactures) && woManufactures.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Productions
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {woManufactures.map((m: any) => (
                      <TableRow key={m.id ?? `${m.reference}_${m.date}`}>
                        <TableCell>{m.id ?? "-"}</TableCell>
                        <TableCell>{m.reference ?? m.ref ?? ""}</TableCell>
                        <TableCell>
                          {m.date ? String(m.date).split("T")[0] : (m.tran_date ?? "")}
                        </TableCell>
                        <TableCell align="right">
                          {Number(m.quantity ?? m.qty ?? 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
          {!loading && !workOrder && (
            <Paper sx={{ p: 2 }}>
              <Typography>No work order found.</Typography>
            </Paper>
          )}
        </>
      }
    />
  );
}
