import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useMemo } from "react";
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack, Button } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { getLocations } from "../../../../api/FixedAssetsLocation/FixedAssetsLocationApi";

function faLocationCode(loc: { locationCode?: string; loc_code?: string }): string {
  return String(loc.locationCode ?? loc.loc_code ?? "");
}

function faLocationName(loc: { locationName?: string; location_name?: string; locationCode?: string; loc_code?: string }): string {
  return loc.locationName ?? loc.location_name ?? faLocationCode(loc);
}

export default function ViewFixedAssetsLocationTransfers() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { reference, date, fromLocation, toLocation, items = [], trans_no } = state || {};

  const transNo = trans_no || (reference ? reference.split("/")[0] : undefined);

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Fixed Assets Location Transfers" },
  ];

  const { data: locations = [] } = useQuery({
    queryKey: ["fixedAssetsLocations"],
    queryFn: getLocations,
  });

  const fromName = useMemo(() => {
    const f = locations.find((l: any) => faLocationCode(l) === String(fromLocation));
    return f ? faLocationName(f) : fromLocation;
  }, [locations, fromLocation]);

  const toName = useMemo(() => {
    const t = locations.find((l: any) => faLocationCode(l) === String(toLocation));
    return t ? faLocationName(t) : toLocation;
  }, [locations, toLocation]);

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
          <PageTitle title={`Fixed Assets Transfers #${transNo ?? "-"}`} />
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
                    <TableCell>{it.itemCode ?? it.selectedItemId ?? "-"}</TableCell>
                    <TableCell>{it.description ?? "-"}</TableCell>
                    <TableCell>{it.quantity ?? "-"}</TableCell>
                    <TableCell>{it.unit ?? "-"}</TableCell>
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
