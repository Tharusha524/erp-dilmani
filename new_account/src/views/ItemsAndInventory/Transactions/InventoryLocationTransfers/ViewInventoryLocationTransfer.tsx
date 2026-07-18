import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useMemo } from "react";
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack, Button, CircularProgress } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getInventoryTransfer } from "../../../../api/Inventory/InventoryTransactionApi";

export default function ViewInventoryLocationTransfer() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const transNoFromState = state?.trans_no;
  const transNoFromRef = state?.reference ? String(state.reference).split("/")[0] : undefined;
  const transNoParam = searchParams.get("trans_no");
  const transNo = Number(transNoFromState ?? transNoParam ?? transNoFromRef ?? 0) || 0;

  const { data: fetched, isLoading } = useQuery({
    queryKey: ["inventory-transfer", transNo],
    queryFn: () => getInventoryTransfer(transNo),
    enabled: transNo > 0 && !state?.items?.length,
  });

  const record = fetched ?? state;
  const reference = record?.reference ?? state?.reference;
  const date = record?.trans_date ?? record?.date ?? state?.date;
  const fromLocation = record?.from_loc_code ?? record?.fromLocation ?? state?.fromLocation;
  const toLocation = record?.to_loc_code ?? record?.toLocation ?? state?.toLocation;
  const items = record?.items ?? state?.items ?? [];

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Inventory Location Transfers" },
  ];

  const { data: locations = [] } = useQuery({
    queryKey: ["inventoryLocations"],
    queryFn: getInventoryLocations,
  });

  const fromName = useMemo(() => {
    const f = locations.find((l: any) => String(l.loc_code) === String(fromLocation));
    return record?.from_loc_name ?? (f ? f.location_name : fromLocation);
  }, [locations, fromLocation, record?.from_loc_name]);

  const toName = useMemo(() => {
    const t = locations.find((l: any) => String(l.loc_code) === String(toLocation));
    return record?.to_loc_name ?? (t ? t.location_name : toLocation);
  }, [locations, toLocation, record?.to_loc_name]);

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 6 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <FormPageLayout>
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
          <PageTitle title={`Inventory Transfer #${transNo || "-"}`} />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ mb: 1, fontWeight: 600 }}>
          From location: {fromName ?? "-"} &nbsp;|&nbsp; To location: {toName ?? "-"} &nbsp;|&nbsp; Reference: {reference || "-"} &nbsp;|&nbsp; Date: {date || "-"}
        </Typography>

        <TableContainer component={Paper} sx={{ p: 1 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>Item Code</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Units</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No items available</TableCell>
                </TableRow>
              ) : (
                items.map((it: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{it.item_code ?? it.itemCode ?? it.stock_id ?? "-"}</TableCell>
                    <TableCell>{it.description ?? "-"}</TableCell>
                    <TableCell>{it.quantity ?? "-"}</TableCell>
                    <TableCell>{it.unit ?? it.units ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </FormPageLayout>
  );
}
