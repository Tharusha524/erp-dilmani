import { FormPageLayout } from "../../../../../components/Layout/FormPageLayout";
import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  useMediaQuery,
  Theme,
  Button,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import Breadcrumb from "../../../../../components/BreadCrumb";
import PageTitle from "../../../../../components/PageTitle";
import theme from "../../../../../theme";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getStockMoves } from "../../../../../api/StockMoves/StockMovesApi";
import { getInventoryLocations, InventoryLocation } from "../../../../../api/InventoryLocation/InventoryLocationApi";
import { getItems } from "../../../../../api/Item/ItemApi";
import { getItemUnits } from "../../../../../api/ItemUnit/ItemUnitApi";

interface ItemTransactionProps {
  itemId?: string | number;
}

export default function ItemLocationTransferDetails({ itemId }: ItemTransactionProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch data from stock_moves
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const stockMoves: any[] = await getStockMoves();
        const invLocs: InventoryLocation[] = await getInventoryLocations();
        const invMap = new Map<string, string>();
        invLocs.forEach((l) => {
          if (l.loc_code) invMap.set(String(l.loc_code), l.location_name);
        });

        // Fetch stock master records (items) and units to enrich transactions
        const stockMasters: any[] = await getItems();
        const itemUnits: any[] = await getItemUnits();

        const stockMap = new Map<string, any>();
        stockMasters.forEach((s) => {
          const key = String(s.stock_id ?? s.id ?? s.stock_master_id ?? s.item_id ?? "");
          stockMap.set(key, s);
        });

        const unitMap = new Map<string, string>();
        itemUnits.forEach((u: any) => {
          const key = String(u.id ?? u.unit_id ?? u.code ?? u.name ?? "");
          const desc = u.description || u.name || u.unit || u.code || "";
          unitMap.set(key, desc);
        });

        // Determine if we should filter by reference (from query or navigation state)
        const search = new URLSearchParams(location.search);
        const refFromQuery = search.get("ref");
        // If the route was navigated with state, prefer that too
        // (react-router's useLocation could be used when available in caller context)
        // We'll filter by reference if provided, otherwise fall back to itemId filtering.
        let filteredMoves: any[];
        if (refFromQuery) {
          // When filtering by reference, only include transfers (type === 16)
          filteredMoves = stockMoves.filter((m) => {
            const mRef = m.reference ?? m.trans_no ?? m.id ?? "";
            // Match exact or starts-with to be a bit tolerant
            return (String(mRef) === String(refFromQuery) || String(mRef).startsWith(String(refFromQuery))) && m.type === 16;
          });
        } else {
          // If itemId provided, filter by item AND type 16; otherwise include only type 16 moves
          filteredMoves = itemId
            ? stockMoves.filter((m) => String(m.stock_id) === String(itemId) && m.type === 16)
            : stockMoves.filter((m) => m.type === 16);
        }

        // Sort by date
        filteredMoves.sort((a: any, b: any) => {
          const da = new Date(a.tran_date || a.date || 0).getTime();
          const db = new Date(b.tran_date || b.date || 0).getTime();
          return da - db;
        });

        // If a specific reference was selected, backend often stores transfers as two rows
        // (one negative from-source and one positive to-destination). In that case we want
        // to collapse the pair into a single combined entry per item so the UI shows only
        // one row for the transfer quantity instead of both +/- rows.
        let mapped: any[] = [];

        if (refFromQuery) {
          // Group moves by stock item for this reference
          const groups = new Map<string, any[]>();
          filteredMoves.forEach((m) => {
            const key = String(m.stock_id ?? m.item_code ?? m.stock_master_id ?? m.item_id ?? "");
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(m);
          });

          // helper to read qty and various location fields robustly
          const getQty = (mm: any) => Number(mm.qty ?? mm.quantity ?? mm.qty_movement ?? 0);

          const getLocationFromRow = (mm: any, preferTo = false) => {
            if (!mm) return "—";
            // candidate keys to check (prefer code fields so we can map via invMap)
            const codeFields = [
              mm.from_loc_code,
              mm.from_loc,
              mm.from_location,
              mm.loc_code,
              mm.locCode,
              mm.location_code,
              mm.location && mm.location.loc_code,
              mm.loc && mm.loc.loc_code,
            ];
            const codeFieldsTo = [
              mm.to_loc_code,
              mm.to_loc,
              mm.to_location,
              mm.loc_code,
              mm.locCode,
              mm.location_code,
              mm.location && mm.location.loc_code,
              mm.loc && mm.loc.loc_code,
            ];

            const fieldsToCheck = preferTo ? codeFieldsTo : codeFields;
            for (const f of fieldsToCheck) {
              if (f !== undefined && f !== null && String(f) !== "") {
                const mapped = invMap.get(String(f));
                if (mapped) return mapped;
                return String(f);
              }
            }

            // fallback to generic names
            const fallbacks = preferTo
              ? [mm.to_location, mm.to_loc, mm.toLocation, mm.toLoc, mm.location, mm.loc?.location_name]
              : [mm.from_location, mm.from_loc, mm.fromLocation, mm.fromLoc, mm.location, mm.loc?.location_name];
            for (const fb of fallbacks) {
              if (fb !== undefined && fb !== null && String(fb) !== "") return String(fb);
            }

            return "—";
          };

          groups.forEach((moves, key) => {
            const neg = moves.find((mm) => getQty(mm) < 0) || null;
            const pos = moves.find((mm) => getQty(mm) > 0) || null;

            // Take fromLocation from negative-row when available, otherwise fallback to first row
            const fromLoc = neg ? getLocationFromRow(neg, false) : getLocationFromRow(moves[0], false);
            // Take toLocation from positive-row when available, otherwise fallback to first row
            const toLoc = pos ? getLocationFromRow(pos, true) : getLocationFromRow(moves[0], true);

            const stockIdKey = key;
            const stockMaster = stockMap.get(stockIdKey) || null;

            const description =
              (stockMaster && (stockMaster.description || stockMaster.name || stockMaster.item_description)) ||
              (pos && (pos.description || pos.memo || pos.detail)) ||
              (neg && (neg.description || neg.memo || neg.detail)) ||
              "";

            let units = "";
            if (stockMaster && (stockMaster.units !== undefined && stockMaster.units !== null)) {
              units = unitMap.get(String(stockMaster.units)) || String(stockMaster.units);
            } else if (pos && (pos.units || pos.unit)) {
              units = String(pos.units ?? pos.unit);
            } else if (neg && (neg.units || neg.unit)) {
              units = String(neg.units ?? neg.unit);
            }

            const quantity = pos ? Math.abs(getQty(pos) || 0) : Math.abs(getQty(neg) || 0);

            mapped.push({
              id: (pos && pos.id) || (neg && neg.id) || key,
              reference: (pos && (pos.reference ?? pos.trans_no)) || (neg && (neg.reference ?? neg.trans_no)) || "",
              date: (pos && (pos.tran_date ?? pos.date)) || (neg && (neg.tran_date ?? neg.date)) || "",
              fromLocation: fromLoc,
              toLocation: toLoc,
              itemCode: key,
              description,
              quantity,
              units,
            });
          });
        } else {
          // Default behavior for non-ref views: map each move individually
          mapped = filteredMoves.map((m: any, idx: number) => {
            const fromLoc =
              invMap.get(String(m.from_loc_code)) ||
              m.from_location ||
              "—";
            const toLoc =
              invMap.get(String(m.to_loc_code)) ||
              m.to_location ||
              "—";

            const stockIdKey = String(m.stock_id ?? m.item_code ?? m.stock_master_id ?? m.item_id ?? "");
            const stockMaster = stockMap.get(stockIdKey) || null;

            const description =
              (stockMaster && (stockMaster.description || stockMaster.name || stockMaster.item_description)) ||
              m.description ||
              m.memo ||
              m.detail ||
              "";

            let units = "";
            if (stockMaster && (stockMaster.units !== undefined && stockMaster.units !== null)) {
              units = unitMap.get(String(stockMaster.units)) || String(stockMaster.units);
            } else if (m.units || m.unit) {
              units = String(m.units ?? m.unit);
            }

            return {
              id: m.id ?? idx,
              reference: m.reference ?? "",
              date: m.tran_date ?? m.date ?? "",
              fromLocation: fromLoc,
              toLocation: toLoc,
              itemCode: m.stock_id ?? m.item_code ?? "",
              description,
              quantity: Number(m.qty) ?? 0,
              units,
            };
          });
        }

        setTransactions(mapped.reverse());
      } catch (err) {
        console.error("Failed to fetch stock moves:", err);
        setTransactions([]);
      }
    };

    fetchTransactions();
  }, [itemId]);

  // Fetch inventory locations
  useEffect(() => {
    const fetchInventoryLocations = async () => {
      try {
        const invLocs = await getInventoryLocations();
        setLocations(invLocs || []);
      } catch (err) {
        console.error("Failed to fetch inventory locations:", err);
        setLocations([]);
      }
    };
    fetchInventoryLocations();
  }, []);

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Item Transactions Details" },
  ];

  return (
    <FormPageLayout>
      {/* Header */}
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          marginY: 2,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <PageTitle title="Item Transactions Details" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
      {/* Table 1: Transaction Info */}
      <Typography variant="h6" sx={{ px: 2 }}>
        Transaction Information
      </Typography>
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>Reference</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>From Location</TableCell>
              <TableCell>To Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((txn) => (
                <TableRow key={txn.id} hover>
                  <TableCell>{txn.reference}</TableCell>
                  <TableCell>{txn.date}</TableCell>
                  <TableCell>{txn.fromLocation}</TableCell>
                  <TableCell>{txn.toLocation}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2">No Records Found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Table 2: Item Details */}
      <Typography variant="h6" sx={{ px: 2 }}>
        Item Details
      </Typography>
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>Item Code</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Units</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((txn) => (
                <TableRow key={txn.id} hover>
                  <TableCell>{txn.itemCode}</TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell>{txn.quantity}</TableCell>
                  <TableCell>{txn.units}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2">No Records Found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </FormPageLayout>
  );
}
