import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { enqueueSnackbar } from "notistack";
import { FormPageLayout } from "../../components/Layout/FormPageLayout";
import { createWorkOrder, getWorkOrder, updateWorkOrder } from "../../api/WorkOrder/workOrderApi";
import { getOrganization } from "../../api/OrganizationSettings/organizationSettingsApi";
import { cleanWoNumberInput, formatWoAmount, formatWoNumberInputDisplay } from "../../utils/workOrderNumberFormat";

const AREAS = ["Front", "Back", "Sleeves", "Others"] as const;
const SIZE_COLUMNS = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

type AreaLine = { qty: string; stitches: string; stitchesPrice: string; totalPrice: string };

const emptyAreaLines = (): Record<string, AreaLine> =>
  Object.fromEntries(AREAS.map((a) => [a, { qty: "", stitches: "", stitchesPrice: "", totalPrice: "" }]));

/** Extracts qty/stitches/stitchesPrice back out of an item_name like
 * "Front (Qty 10, Stitches 5000, Stitches Price 2)" — inverse of the string
 * handleSubmit builds when saving. */
const parseAreaLineFromItemName = (itemName: string, price: string): AreaLine => {
  const qtyMatch = itemName.match(/Qty ([\d.]+)/);
  const stitchesMatch = itemName.match(/Stitches ([\d.]+)/);
  const stitchesPriceMatch = itemName.match(/Stitches Price ([\d.]+)/);
  return {
    qty: qtyMatch?.[1] || "",
    stitches: stitchesMatch?.[1] || "",
    stitchesPrice: stitchesPriceMatch?.[1] || "",
    totalPrice: price || "",
  };
};

const AddEmbroideryJobSheet = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("editId");
  const isEditing = !!editId;

  const { data: existingOrder } = useQuery({
    queryKey: ["wo-sheet-order", editId],
    queryFn: () => getWorkOrder(editId as string),
    enabled: isEditing,
  });

  const { data: organizationData } = useQuery({
    queryKey: ["organization"],
    queryFn: getOrganization,
  });
  const orgName = organizationData?.organizationName?.trim() || "Company";

  const [date, setDate] = useState("");
  const [customer, setCustomer] = useState("");
  const [jobName, setJobName] = useState("");
  const [areaLines, setAreaLines] = useState<Record<string, AreaLine>>(emptyAreaLines());
  const [sizeQty, setSizeQty] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!existingOrder) return;
    setDate(existingOrder.order_date?.slice(0, 10) || "");
    setCustomer(existingOrder.customer || "");
    setJobName(existingOrder.description || "");

    const nextAreaLines = emptyAreaLines();
    existingOrder.price_items?.forEach((p) => {
      const area = AREAS.find((a) => p.item_name === a || p.item_name.startsWith(`${a} (`));
      if (area) nextAreaLines[area] = parseAreaLineFromItemName(p.item_name, String(p.price));
    });
    setAreaLines(nextAreaLines);

    const nextSizeQty: Record<string, string> = {};
    existingOrder.sizes?.forEach((s) => {
      nextSizeQty[`${s.category}-${s.size_label}`] = String(s.quantity);
    });
    setSizeQty(nextSizeQty);
  }, [existingOrder]);

  const updateAreaLine = (area: string, field: keyof AreaLine, value: string) => {
    setAreaLines((prev) => ({ ...prev, [area]: { ...prev[area], [field]: value } }));
  };

  const sizeKey = (area: string, size: string) => `${area}-${size}`;

  const totalOrderQuantity = AREAS.reduce((sum, area) => sum + (parseInt(areaLines[area].qty || "0", 10) || 0), 0);
  const grandTotalPrice = AREAS.reduce((sum, area) => sum + (parseFloat(areaLines[area].totalPrice || "0") || 0), 0);

  const { mutate: submitJobSheet, isPending } = useMutation({
    mutationFn: (formData: FormData) =>
      isEditing ? updateWorkOrder(editId as string, formData) : createWorkOrder(formData),
    onSuccess: () => {
      enqueueSnackbar(
        isEditing ? "Embroidery job sheet updated successfully!" : "Embroidery job sheet created successfully!",
        { variant: "success" }
      );
      navigate("/workorder/create/embroidery");
    },
    onError: () => {
      enqueueSnackbar(isEditing ? "Failed to update job sheet" : "Failed to create job sheet", {
        variant: "error",
      });
    },
  });

  const handleSubmit = () => {
    if (!customer.trim()) {
      enqueueSnackbar("Please enter the customer", { variant: "warning" });
      return;
    }

    const formData = new FormData();
    formData.append("category", "embroidery_job");
    formData.append("department", "Embroidery");
    formData.append("order_date", date);
    formData.append("customer", customer);
    formData.append("description", jobName);
    formData.append("order_quantity", String(totalOrderQuantity));
    formData.append("balance", String(grandTotalPrice));

    let priceIndex = 0;
    AREAS.forEach((area) => {
      const line = areaLines[area];
      if (line.qty || line.stitches || line.stitchesPrice || line.totalPrice) {
        const details = [
          line.qty && `Qty ${line.qty}`,
          line.stitches && `Stitches ${line.stitches}`,
          line.stitchesPrice && `Stitches Price ${line.stitchesPrice}`,
        ]
          .filter(Boolean)
          .join(", ");
        formData.append(`price_items[${priceIndex}][item_name]`, details ? `${area} (${details})` : area);
        formData.append(`price_items[${priceIndex}][price]`, line.totalPrice || "0");
        priceIndex += 1;
      }
    });

    let sizeIndex = 0;
    AREAS.forEach((area) => {
      SIZE_COLUMNS.forEach((size) => {
        const qty = sizeQty[sizeKey(area, size)];
        if (qty && parseInt(qty, 10) > 0) {
          formData.append(`sizes[${sizeIndex}][category]`, area);
          formData.append(`sizes[${sizeIndex}][size_label]`, size);
          formData.append(`sizes[${sizeIndex}][quantity]`, qty);
          sizeIndex += 1;
        }
      });
    });

    submitJobSheet(formData);
  };

  return (
    <FormPageLayout>
      <Box p={3}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: "1200px", margin: "0 auto" }}>
          <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
            {orgName.toUpperCase()} EMBROIDERY DESIGN
          </Typography>
          <Typography variant="subtitle1" align="center" gutterBottom fontWeight="bold">
            JOB SHEET
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                size="small"
                margin="normal"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <TextField
                fullWidth
                label="Customer"
                size="small"
                margin="normal"
                required
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
              <TextField
                fullWidth
                label="Job Name"
                size="small"
                margin="normal"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }} />
                      <TableCell sx={{ fontWeight: "bold" }} align="center">Qty</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="center">Stitches</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="center">Stitches Price</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="center">Total Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {AREAS.map((area) => (
                      <TableRow key={area}>
                        <TableCell sx={{ fontWeight: "bold" }}>{area}</TableCell>
                        {(["qty", "stitches", "stitchesPrice", "totalPrice"] as const).map((field) => (
                          <TableCell key={field} align="center" padding="none">
                            <TextField
                              variant="outlined"
                              size="small"
                              type="text"
                              inputMode="decimal"
                              fullWidth
                              value={formatWoNumberInputDisplay(areaLines[area][field])}
                              onChange={(e) => updateAreaLine(area, field, cleanWoNumberInput(e.target.value))}
                              inputProps={{ style: { textAlign: "center" } }}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Total</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>
                        {formatWoAmount(grandTotalPrice)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="subtitle2" fontWeight="bold" gutterBottom align="center">
            Size Breakdown by Area
          </Typography>
          <Grid container spacing={2}>
            {AREAS.map((area) => (
              <Grid item xs={12} sm={6} md={3} key={area}>
                <Typography variant="subtitle2" fontWeight="bold" align="center" gutterBottom>
                  {area}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Size</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }} align="center">Qty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {SIZE_COLUMNS.map((size) => (
                        <TableRow key={size}>
                          <TableCell>{size}</TableCell>
                          <TableCell align="center" padding="none">
                            <TextField
                              variant="outlined"
                              size="small"
                              type="text"
                              inputMode="numeric"
                              fullWidth
                              value={formatWoNumberInputDisplay(sizeQty[sizeKey(area, size)] || "")}
                              onChange={(e) =>
                                setSizeQty((prev) => ({
                                  ...prev,
                                  [sizeKey(area, size)]: cleanWoNumberInput(e.target.value),
                                }))
                              }
                              inputProps={{ style: { textAlign: "center" } }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            ))}
          </Grid>

          <Box mt={4} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleSubmit}
              disabled={isPending}
              endIcon={isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {isEditing ? "Update Work Order" : "Add Work Order"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </FormPageLayout>
  );
};

export default AddEmbroideryJobSheet;
