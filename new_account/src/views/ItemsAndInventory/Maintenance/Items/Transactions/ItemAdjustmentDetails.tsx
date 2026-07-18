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
import { getItems } from "../../../../../api/Item/ItemApi";
import { getItemUnits } from "../../../../../api/ItemUnit/ItemUnitApi";
import { getInventoryLocations, InventoryLocation } from "../../../../../api/InventoryLocation/InventoryLocationApi";

interface ItemAdjustmentDetailsProps {
  itemId?: string | number;
}

export default function ItemAdjustmentDetails({ itemId }: ItemAdjustmentDetailsProps) {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchAdjustments = async () => {
      try {
        const stockMoves: any[] = await getStockMoves();
        const [invLocs, itemsRes, itemUnitsRes] = await Promise.all([
          getInventoryLocations(),
          getItems(),
          getItemUnits(),
        ]);

        // Map of location code -> location name
        const invMap = new Map<string, string>();
        invLocs.forEach((l) => {
          if (l.loc_code) invMap.set(String(l.loc_code), l.location_name);
        });

        // Build item lookup by stock_id (stock master) so we can get description/units
        const itemMap = new Map<string, any>();
        (itemsRes || []).forEach((it: any) => {
          const key = String(it.stock_id ?? it.id ?? it.stock_master_id ?? it.item_id ?? "");
          if (key) itemMap.set(key, it);
        });

        // Build unit lookup
        const unitMap = new Map<string, any>();
        (itemUnitsRes || []).forEach((u: any) => {
          unitMap.set(String(u.id ?? u.unit_id ?? u.name ?? u.description ?? u), u);
        });

        // Get reference from URL query (if available)
        const search = new URLSearchParams(location.search);
        const refFromQuery = search.get("ref");

        let filteredMoves: any[] = [];

        if (refFromQuery) {
          // Only include adjustment moves (type === 17) when filtering by reference
          filteredMoves = stockMoves.filter((m) => {
            const ref = m.reference ?? m.trans_no ?? m.id ?? "";
            return (String(ref) === String(refFromQuery) || String(ref).startsWith(String(refFromQuery))) && m.type === 17;
          });
        } else if (itemId) {
          // Filter by item and adjustment type
          filteredMoves = stockMoves.filter((m) => String(m.stock_id) === String(itemId) && m.type === 17);
        } else {
          // Show only adjustments
          filteredMoves = stockMoves.filter((m) => m.type === 17);
        }

        // Sort by date ascending
        filteredMoves.sort((a: any, b: any) => {
          const da = new Date(a.tran_date || a.date || 0).getTime();
          const db = new Date(b.tran_date || b.date || 0).getTime();
          return da - db;
        });

        const mapped = filteredMoves.map((m: any, idx: number) => ({
          id: m.id ?? idx,
          atLocation:
            invMap.get(String(m.loc_code)) ||
            m.location_name ||
            m.location ||
            "—",
          reference: m.reference ?? "",
          date: m.tran_date ?? m.date ?? "",
          itemCode: m.stock_id ?? m.item_code ?? "",
          // Prefer description/units from stock master when available
          description:
            (itemMap.get(String(m.stock_id))?.description) ??
            m.description ??
            m.memo ??
            m.detail ??
            "",
          quantity: Number(m.qty) ?? 0,
          units: (() => {
            const item = itemMap.get(String(m.stock_id));
            if (item && (item.units !== undefined && item.units !== null && item.units !== "")) {
              const u = unitMap.get(String(item.units));
              return u?.description ?? u?.name ?? item.units;
            }
            // fallback to units on the stock move itself
            const moveUnits = m.units ?? m.unit ?? "";
            // try to resolve moveUnits via unitMap if it's an id
            const unitResolved = unitMap.get(String(moveUnits));
            return unitResolved?.description ?? unitResolved?.name ?? moveUnits;
          })(),
          unitCost: m.standard_cost ?? m.unit_cost ?? m.cost ?? 0,
        }));

        setAdjustments(mapped.reverse());
      } catch (err) {
        console.error("Failed to fetch stock moves:", err);
        setAdjustments([]);
      }
    };

    fetchAdjustments();
  }, [itemId]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const invLocs = await getInventoryLocations();
        setLocations(invLocs || []);
      } catch (err) {
        console.error("Failed to fetch inventory locations:", err);
        setLocations([]);
      }
    };
    fetchLocations();
  }, []);

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Item Adjustment Details" },
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
          <PageTitle title="Item Adjustment Details" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
      {/* Table 1: Adjustment Info */}
      <Typography variant="h6" sx={{ px: 2 }}>
        Adjustment Information
      </Typography>
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>At Location</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adjustments.length > 0 ? (
              adjustments.map((adj) => (
                <TableRow key={adj.id} hover>
                  <TableCell>{adj.atLocation}</TableCell>
                  <TableCell>{adj.reference}</TableCell>
                  <TableCell>{adj.date}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
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
              <TableCell>Unit Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adjustments.length > 0 ? (
              adjustments.map((adj) => (
                <TableRow key={adj.id} hover>
                  <TableCell>{adj.itemCode}</TableCell>
                  <TableCell>{adj.description}</TableCell>
                  <TableCell>{adj.quantity}</TableCell>
                  <TableCell>{adj.units}</TableCell>
                  <TableCell>{adj.unitCost}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
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
