import React, { useMemo } from "react";
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack, Button } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";

export default function ViewFixedAssetsDisposal() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { location: loc, reference, date, items = [], trans_no, trans_type } = state || {};

  const transNo = trans_no || (reference ? reference.split("/")[0] : undefined);

  // Fetch inventory locations so we can display human-friendly location_name
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
    { title: "Fixed Assets", href: "/fixedassets/transactions" },
    { title: "Fixed Assets Disposal" },
  ];

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
          <PageTitle title={`Fixed Assets Disposal #${transNo ?? "-"}`} />
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
                    <TableCell>{it.itemCode ?? it.selectedItemId ?? "-"}</TableCell>
                    <TableCell>{it.description ?? "-"}</TableCell>
                    <TableCell>{it.quantity ?? "-"}</TableCell>
                    <TableCell>{it.unit ?? "-"}</TableCell>
                    <TableCell>{it.unitCost ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() =>
              navigate("/fixedassets/transactions/gl-journal-entries", {
                state: {
                  reference,
                  date,
                  trans_no: trans_no ?? transNo,
                  trans_type: trans_type ?? 17,
                },
              })
            }
          >
            View GL Journal Entries
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
