import React, { useMemo } from "react";
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack, Button, CircularProgress } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getInventoryAdjustment } from "../../../../api/Inventory/InventoryTransactionApi";

export default function ViewInventoryAdjustment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const transNoFromState = state?.trans_no;
  const transNoFromRef = state?.reference ? String(state.reference).split("/")[0] : undefined;
  const transNoParam = searchParams.get("trans_no");
  const transNo = Number(transNoFromState ?? transNoParam ?? transNoFromRef ?? 0) || 0;

  const { data: fetched, isLoading } = useQuery({
    queryKey: ["inventory-adjustment", transNo],
    queryFn: () => getInventoryAdjustment(transNo),
    enabled: transNo > 0 && !state?.items?.length,
  });

  const record = fetched ?? state;
  const loc = record?.loc_code ?? record?.location ?? state?.location;
  const reference = record?.reference ?? state?.reference;
  const date = record?.trans_date ?? record?.date ?? state?.date;
  const items = record?.items ?? state?.items ?? [];

  const { data: locations = [] } = useQuery({
    queryKey: ["inventoryLocations"],
    queryFn: getInventoryLocations,
  });

  const locationName = useMemo(() => {
    if (!loc) return undefined;
    const found = (locations || []).find((l: any) => String(l.loc_code) === String(loc));
    return found ? found.location_name : undefined;
  }, [locations, loc]);

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Inventory Adjustments" },
  ];

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 6 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          padding: 2,
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <PageTitle title={`Inventory Adjustment #${transNo || "-"}`} />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ mb: 1, fontWeight: 600 }}>
          At location: {locationName ?? loc ?? "-"} &nbsp;|&nbsp; Reference: {reference || "-"} &nbsp;|&nbsp; Date: {date || "-"}
        </Typography>

        <TableContainer component={Paper} sx={{ p: 1 }}>
          <Table size="small">
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
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No items available</TableCell>
                </TableRow>
              ) : (
                items.map((it: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{it.item_code ?? it.itemCode ?? it.stock_id ?? "-"}</TableCell>
                    <TableCell>{it.description ?? "-"}</TableCell>
                    <TableCell>{it.quantity ?? "-"}</TableCell>
                    <TableCell>{it.unit ?? it.units ?? "-"}</TableCell>
                    <TableCell>{it.unit_cost ?? it.unitCost ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
