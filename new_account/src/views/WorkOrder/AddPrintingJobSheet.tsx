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
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { enqueueSnackbar } from "notistack";
import { FormPageLayout } from "../../components/Layout/FormPageLayout";
import { createWorkOrder, getWorkOrder, updateWorkOrder } from "../../api/WorkOrder/workOrderApi";
import { getOrganization } from "../../api/OrganizationSettings/organizationSettingsApi";
import { cleanWoNumberInput, formatWoNumberInputDisplay, formatWoQuantity } from "../../utils/workOrderNumberFormat";
import { getApiBaseUrl } from "../../config/backendConfig";

const storageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  const apiBase = getApiBaseUrl().replace(/\/+$/, "");
  const backendBase = apiBase.replace(/\/index\.php\/api$/i, "").replace(/\/api$/i, "");
  return `${backendBase}/storage/${path.replace(/^\/+/, "")}`;
};

const SIZE_COLUMNS = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL"];
const SIZE_ROWS = ["GENTS", "LADIES", "BOYS"] as const;

// On the paper form, the Boys row only uses XXS/XS/S as real quantity boxes —
// M onward is repurposed there for Total/Price/Operator/Data Entry instead.
const BOYS_SIZE_COLUMNS = ["XXS", "XS", "S"];
const isSizeInputVisible = (row: string, size: string) => row !== "BOYS" || BOYS_SIZE_COLUMNS.includes(size);

/** Splits the combined remark text back into (remark, operator, dataEntry,
 * boysPrice) — inverse of how handleSubmit joins them into one field on save. */
const parseRemarkFields = (remarkText?: string | null) => {
  const lines = (remarkText || "").split("\n");
  let operator = "";
  let dataEntry = "";
  let boysPrice = "";
  const remainder: string[] = [];
  lines.forEach((line) => {
    const opMatch = line.match(/^Operator: (.*)$/);
    const deMatch = line.match(/^Data Entry: (.*)$/);
    const bpMatch = line.match(/^Boys Price: (.*)$/);
    if (opMatch) operator = opMatch[1];
    else if (deMatch) dataEntry = deMatch[1];
    else if (bpMatch) boysPrice = bpMatch[1];
    else if (line) remainder.push(line);
  });
  return { remark: remainder.join("\n"), operator, dataEntry, boysPrice };
};

const AddPrintingJobSheet = () => {
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
  const [price, setPrice] = useState("");
  const [remark, setRemark] = useState("");
  const [operator, setOperator] = useState("");
  const [dataEntry, setDataEntry] = useState("");
  const [boysPrice, setBoysPrice] = useState("");
  const [front, setFront] = useState(false);
  const [back, setBack] = useState(false);
  const [longSleeve, setLongSleeve] = useState(false);
  const [shortSleeve, setShortSleeve] = useState(false);
  const [sizeQty, setSizeQty] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (!existingOrder) return;
    setDate(existingOrder.order_date?.slice(0, 10) || "");
    setCustomer(existingOrder.customer || "");
    setJobName(existingOrder.description || "");
    setPrice(existingOrder.total_price != null ? String(existingOrder.total_price) : "");
    setImagePreview(storageUrl(existingOrder.front_image_path));
    const sides = existingOrder.sub_category || "";
    setFront(sides.includes("Front"));
    setBack(sides.includes("Back"));
    setLongSleeve(sides.includes("Long Sleeve"));
    setShortSleeve(sides.includes("Short Sleeve"));
    const {
      remark: parsedRemark,
      operator: parsedOperator,
      dataEntry: parsedDataEntry,
      boysPrice: parsedBoysPrice,
    } = parseRemarkFields(existingOrder.remark);
    setRemark(parsedRemark);
    setOperator(parsedOperator);
    setDataEntry(parsedDataEntry);
    setBoysPrice(parsedBoysPrice);

    const nextSizeQty: Record<string, string> = {};
    existingOrder.sizes?.forEach((s) => {
      nextSizeQty[`${s.category}-${s.size_label}`] = String(s.quantity);
    });
    setSizeQty(nextSizeQty);
  }, [existingOrder]);

  const sizeKey = (row: string, size: string) => `${row}-${size}`;

  const rowTotal = (row: string) =>
    SIZE_COLUMNS.reduce((sum, size) => sum + (parseInt(sizeQty[sizeKey(row, size)] || "0", 10) || 0), 0);

  const totalOrderQuantity = SIZE_ROWS.reduce((sum, row) => sum + rowTotal(row), 0);

  const { mutate: submitJobSheet, isPending } = useMutation({
    mutationFn: (formData: FormData) =>
      isEditing ? updateWorkOrder(editId as string, formData) : createWorkOrder(formData),
    onSuccess: () => {
      enqueueSnackbar(
        isEditing ? "Printing job sheet updated successfully!" : "Printing job sheet created successfully!",
        { variant: "success" }
      );
      navigate("/workorder/create/printing");
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

    const sides = [front && "Front", back && "Back", longSleeve && "Long Sleeve", shortSleeve && "Short Sleeve"]
      .filter(Boolean)
      .join(", ");

    const remarkLines = [
      remark,
      operator && `Operator: ${operator}`,
      dataEntry && `Data Entry: ${dataEntry}`,
      boysPrice && `Boys Price: ${boysPrice}`,
    ]
      .filter(Boolean)
      .join("\n");

    const formData = new FormData();
    formData.append("category", "printing_job");
    formData.append("department", "Printing");
    formData.append("order_date", date);
    formData.append("customer", customer);
    formData.append("description", jobName);
    formData.append("sub_category", sides);
    formData.append("order_quantity", String(totalOrderQuantity));
    if (price) {
      formData.append("total_price", price);
      formData.append("balance", price);
    }
    if (remarkLines) formData.append("remark", remarkLines);
    if (imageFile) formData.append("front_image", imageFile);

    let sizeIndex = 0;
    SIZE_ROWS.forEach((row) => {
      SIZE_COLUMNS.forEach((size) => {
        const qty = sizeQty[sizeKey(row, size)];
        if (qty && parseInt(qty, 10) > 0) {
          formData.append(`sizes[${sizeIndex}][category]`, row);
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
        <Paper elevation={3} sx={{ p: 4, maxWidth: "1000px", margin: "0 auto" }}>
          <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
            SUBLIMATION PRINTING
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
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={<Checkbox checked={front} onChange={(e) => setFront(e.target.checked)} />}
                    label="Front"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={<Checkbox checked={back} onChange={(e) => setBack(e.target.checked)} />}
                    label="Back"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={<Checkbox checked={longSleeve} onChange={(e) => setLongSleeve(e.target.checked)} />}
                    label="Long Sleeve"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={<Checkbox checked={shortSleeve} onChange={(e) => setShortSleeve(e.target.checked)} />}
                    label="Short Sleeve"
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Price"
                type="text"
                inputMode="decimal"
                size="small"
                margin="normal"
                value={formatWoNumberInputDisplay(price)}
                onChange={(e) => setPrice(cleanWoNumberInput(e.target.value))}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }} />
                  {SIZE_COLUMNS.map((size) => (
                    <TableCell key={size} align="center" sx={{ fontWeight: "bold" }}>
                      {size}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>Total</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SIZE_ROWS.map((row) => (
                  <TableRow key={row}>
                    <TableCell sx={{ fontWeight: "bold" }}>{row.charAt(0) + row.slice(1).toLowerCase()}</TableCell>
                    {SIZE_COLUMNS.map((size) => (
                      <TableCell key={size} align="center" padding="none">
                        {isSizeInputVisible(row, size) && (
                          <TextField
                            variant="outlined"
                            size="small"
                            type="text"
                            inputMode="numeric"
                            fullWidth
                            value={formatWoNumberInputDisplay(sizeQty[sizeKey(row, size)] || "")}
                            onChange={(e) =>
                              setSizeQty((prev) => ({
                                ...prev,
                                [sizeKey(row, size)]: cleanWoNumberInput(e.target.value),
                              }))
                            }
                            inputProps={{ style: { textAlign: "center" } }}
                          />
                        )}
                      </TableCell>
                    ))}
                    <TableCell align="center">
                      <Typography fontWeight="bold">{formatWoQuantity(rowTotal(row))}</Typography>
                    </TableCell>
                    <TableCell align="center" padding="none">
                      {row === "BOYS" && (
                        <TextField
                          variant="outlined"
                          size="small"
                          type="text"
                          inputMode="decimal"
                          fullWidth
                          value={formatWoNumberInputDisplay(boysPrice)}
                          onChange={(e) => setBoysPrice(cleanWoNumberInput(e.target.value))}
                          inputProps={{ style: { textAlign: "center" } }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 4 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>REMARK</Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                placeholder="Enter any additional remarks here..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                label="Operator"
                size="small"
                margin="normal"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                label="Data Entry"
                size="small"
                margin="normal"
                value={dataEntry}
                onChange={(e) => setDataEntry(e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>IMAGE</Typography>
          <Paper
            variant="outlined"
            sx={{
              height: 220,
              maxWidth: 400,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              position: "relative",
              "&:hover": { backgroundColor: "action.hover" },
            }}
            component="label"
          >
            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
            {imagePreview ? (
              <img src={imagePreview} alt="Job Sheet" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <>
                <CloudUploadIcon color="action" sx={{ fontSize: 60, mb: 1 }} />
                <Typography color="textSecondary">Upload Image</Typography>
              </>
            )}
          </Paper>

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

export default AddPrintingJobSheet;
