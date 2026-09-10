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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { enqueueSnackbar } from "notistack";
import { FormPageLayout } from "../../components/Layout/FormPageLayout";
import { createWorkOrder, getWorkOrder, updateWorkOrder } from "../../api/WorkOrder/workOrderApi";
import { getOrganization } from "../../api/OrganizationSettings/organizationSettingsApi";
import {
  cleanWoNumberInput,
  formatWoAmount,
  formatWoNumberInputDisplay,
  formatWoQuantity,
} from "../../utils/workOrderNumberFormat";
import { getApiBaseUrl } from "../../config/backendConfig";

const storageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const apiBase = getApiBaseUrl().replace(/\/+$/, "");
  const backendBase = apiBase.replace(/\/index\.php\/api$/i, "").replace(/\/api$/i, "");
  // Newer uploads (Google Cloud Storage) come back as our own /api/work-order-images
  // proxy path — the bucket is private, so images are streamed through our server.
  if (path.startsWith("/api/")) return `${backendBase}${path}`;
  return `${backendBase}/storage/${path.replace(/^\/+/, "")}`;
};

const AREAS = ["Front", "Back", "Sleeves", "Others"] as const;

// Free-form quantity entry grid per area (matches the paper job sheet's blank
// Front/Back/Sleeves/Others grid): starts at 2 columns x GRID_ROWS rows, each
// cell capped at MAX_PER_CELL. Cells are stored column-major (index =
// col*GRID_ROWS + row) so index+1 naturally walks down a column then rolls
// into the next column — the fill order the job sheet is filled in by hand.
// Each area grows its own extra column once its existing columns fill up —
// it never crosses into another area's grid.
const GRID_ROWS = 14;
const DEFAULT_COLS = 2;
const MAX_PER_CELL = 15;

const emptyGrid = (cols: number = DEFAULT_COLS): string[] => Array(GRID_ROWS * cols).fill("");
const emptyAreaGrids = (): Record<string, string[]> =>
  Object.fromEntries(AREAS.map((a) => [a, emptyGrid()]));
const emptyAreaCols = (): Record<string, number> =>
  Object.fromEntries(AREAS.map((a) => [a, DEFAULT_COLS]));

type AreaLine = { stitches: string; stitchesPrice: string };

const emptyAreaLines = (): Record<string, AreaLine> =>
  Object.fromEntries(AREAS.map((a) => [a, { stitches: "", stitchesPrice: "" }]));

/** Extracts stitches/stitchesPrice back out of an item_name like
 * "Front (Qty 10, Stitches 5000, Stitches Price 2)" — inverse of the string
 * handleSubmit builds when saving. Qty is no longer stored here — it's
 * derived from the size-breakdown grid. */
const parseAreaLineFromItemName = (itemName: string): AreaLine => {
  const stitchesMatch = itemName.match(/Stitches ([\d.]+)/);
  const stitchesPriceMatch = itemName.match(/Stitches Price ([\d.]+)/);
  return {
    stitches: stitchesMatch?.[1] || "",
    stitchesPrice: stitchesPriceMatch?.[1] || "",
  };
};

/** How many columns are needed to hold `cellsNeeded` cells, at least DEFAULT_COLS. */
const colsForCells = (cellsNeeded: number): number =>
  Math.max(DEFAULT_COLS, Math.ceil(cellsNeeded / GRID_ROWS));

/** Distributes a legacy total qty (from job sheets saved before the grid
 * existed) into grid cells at MAX_PER_CELL per cell, so editing an old job
 * sheet still shows its total instead of a blank grid. Grows extra columns
 * if the total needs more than the default 2. */
const distributeQtyIntoGrid = (qty: number): { grid: string[]; cols: number } => {
  const cellsNeeded = Math.max(1, Math.ceil(qty / MAX_PER_CELL));
  const cols = colsForCells(cellsNeeded);
  const grid = emptyGrid(cols);
  let remaining = qty;
  for (let i = 0; i < grid.length && remaining > 0; i += 1) {
    const cell = Math.min(MAX_PER_CELL, remaining);
    grid[i] = String(cell);
    remaining -= cell;
  }
  return { grid, cols };
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
  const [areaGrids, setAreaGrids] = useState<Record<string, string[]>>(emptyAreaGrids());
  const [areaCols, setAreaCols] = useState<Record<string, number>>(emptyAreaCols());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const cellRefs = React.useRef<Record<string, (HTMLInputElement | null)[]>>(
    Object.fromEntries(AREAS.map((a) => [a, Array(GRID_ROWS * DEFAULT_COLS).fill(null)]))
  );

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
    setImagePreview(storageUrl(existingOrder.front_image_path));

    const nextAreaLines = emptyAreaLines();
    existingOrder.price_items?.forEach((p) => {
      const area = AREAS.find((a) => p.item_name === a || p.item_name.startsWith(`${a} (`));
      if (area) nextAreaLines[area] = parseAreaLineFromItemName(p.item_name);
    });
    setAreaLines(nextAreaLines);

    // Rebuild each area's grid from saved "Cell-N" size rows. Job sheets saved
    // before the grid existed only have a single total qty (parsed from the
    // item_name above) and no Cell-N rows — fall back to distributing that
    // total across cells so editing an old sheet still shows its quantity.
    const nextAreaGrids = emptyAreaGrids();
    const nextAreaCols = emptyAreaCols();
    AREAS.forEach((area) => {
      const cellSizes = (existingOrder.sizes || []).filter(
        (s) => s.category === area && /^Cell-\d+$/.test(s.size_label)
      );
      if (cellSizes.length > 0) {
        const maxIdx = Math.max(...cellSizes.map((s) => parseInt(s.size_label.replace("Cell-", ""), 10) - 1));
        const cols = colsForCells(maxIdx + 1);
        const grid = emptyGrid(cols);
        cellSizes.forEach((s) => {
          const idx = parseInt(s.size_label.replace("Cell-", ""), 10) - 1;
          if (idx >= 0 && idx < grid.length) grid[idx] = String(s.quantity);
        });
        nextAreaGrids[area] = grid;
        nextAreaCols[area] = cols;
      } else {
        const qtyMatch = existingOrder.price_items?.find(
          (p) => p.item_name === area || p.item_name.startsWith(`${area} (`)
        )?.item_name.match(/Qty ([\d.]+)/);
        const legacyQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 0;
        if (legacyQty > 0) {
          const { grid, cols } = distributeQtyIntoGrid(legacyQty);
          nextAreaGrids[area] = grid;
          nextAreaCols[area] = cols;
        }
      }
    });
    setAreaGrids(nextAreaGrids);
    setAreaCols(nextAreaCols);
    // Grow the input-ref arrays to match whatever column counts were restored.
    AREAS.forEach((area) => {
      const needed = GRID_ROWS * nextAreaCols[area];
      if (cellRefs.current[area].length < needed) {
        cellRefs.current[area] = [
          ...cellRefs.current[area],
          ...Array(needed - cellRefs.current[area].length).fill(null),
        ];
      }
    });
  }, [existingOrder]);

  const updateAreaLine = (area: string, field: keyof AreaLine, value: string) => {
    setAreaLines((prev) => ({ ...prev, [area]: { ...prev[area], [field]: value } }));
  };

  const areaQty = (area: string): number =>
    (areaGrids[area] || []).reduce((sum, v) => sum + (parseInt(v || "0", 10) || 0), 0);

  const areaTotalPrice = (area: string): number =>
    areaQty(area) * (parseFloat(areaLines[area].stitchesPrice || "0") || 0);

  const updateGridCell = (area: string, index: number, rawValue: string) => {
    let cleaned = cleanWoNumberInput(rawValue);
    const num = parseInt(cleaned, 10);
    if (!Number.isNaN(num) && num > MAX_PER_CELL) cleaned = String(MAX_PER_CELL);

    setAreaGrids((prev) => {
      const nextGrid = [...prev[area]];
      nextGrid[index] = cleaned;

      // Once this area's last cell hits the cap, grow it a fresh column of
      // its own — Front/Back/Sleeves/Others each expand independently and
      // never spill into one another.
      if (cleaned === String(MAX_PER_CELL) && index === nextGrid.length - 1) {
        nextGrid.push(...Array(GRID_ROWS).fill(""));
        setAreaCols((prevCols) => ({ ...prevCols, [area]: prevCols[area] + 1 }));
        if (cellRefs.current[area].length < nextGrid.length) {
          cellRefs.current[area] = [
            ...cellRefs.current[area],
            ...Array(nextGrid.length - cellRefs.current[area].length).fill(null),
          ];
        }
      }

      return { ...prev, [area]: nextGrid };
    });

    // Auto-advance to the next cell once this one hits the cap — column-major
    // indexing means index+1 is "down the column, then into the next column"
    // (or into the newly-grown column when this area's grid was full).
    if (cleaned === String(MAX_PER_CELL)) {
      setTimeout(() => cellRefs.current[area]?.[index + 1]?.focus(), 0);
    }
  };

  const totalOrderQuantity = AREAS.reduce((sum, area) => sum + areaQty(area), 0);
  const grandTotalPrice = AREAS.reduce((sum, area) => sum + areaTotalPrice(area), 0);

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
    if (imageFile) formData.append("front_image", imageFile);

    let priceIndex = 0;
    AREAS.forEach((area) => {
      const line = areaLines[area];
      const qty = areaQty(area);
      const totalPrice = areaTotalPrice(area);
      if (qty || line.stitches || line.stitchesPrice || totalPrice) {
        const details = [
          qty && `Qty ${qty}`,
          line.stitches && `Stitches ${line.stitches}`,
          line.stitchesPrice && `Stitches Price ${line.stitchesPrice}`,
        ]
          .filter(Boolean)
          .join(", ");
        formData.append(`price_items[${priceIndex}][item_name]`, details ? `${area} (${details})` : area);
        formData.append(`price_items[${priceIndex}][price]`, String(totalPrice || 0));
        priceIndex += 1;
      }
    });

    let sizeIndex = 0;
    AREAS.forEach((area) => {
      areaGrids[area].forEach((qty, cellIndex) => {
        if (qty && parseInt(qty, 10) > 0) {
          formData.append(`sizes[${sizeIndex}][category]`, area);
          formData.append(`sizes[${sizeIndex}][size_label]`, `Cell-${cellIndex + 1}`);
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
                        {/* Qty is auto-summed from the Size Breakdown grid below, read-only here. */}
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          {formatWoQuantity(areaQty(area))}
                        </TableCell>
                        {(["stitches", "stitchesPrice"] as const).map((field) => (
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
                        {/* Total Price = Qty x Stitches Price, auto-calculated. */}
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          {formatWoAmount(areaTotalPrice(area))}
                        </TableCell>
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
          <Typography variant="caption" color="text.secondary" display="block" align="center" gutterBottom>
            Fill each column top to bottom (max {MAX_PER_CELL} per cell) — it auto-jumps to the next cell,
            growing a new column of its own once an area fills up, and the total feeds into the Qty above
            automatically.
          </Typography>
          <Grid container spacing={2}>
            {AREAS.map((area) => (
              <Grid item xs={12} sm={6} md={3} key={area}>
                <Typography variant="subtitle2" fontWeight="bold" align="center" gutterBottom>
                  {area} — Total: {formatWoQuantity(areaQty(area))}
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableBody>
                      {Array.from({ length: GRID_ROWS }).map((_, row) => (
                        <TableRow key={row}>
                          {Array.from({ length: areaCols[area] }).map((_, col) => {
                            const index = col * GRID_ROWS + row;
                            return (
                              <TableCell key={col} align="center" padding="none">
                                <TextField
                                  inputRef={(el) => {
                                    cellRefs.current[area][index] = el;
                                  }}
                                  variant="outlined"
                                  size="small"
                                  type="text"
                                  inputMode="numeric"
                                  fullWidth
                                  value={formatWoNumberInputDisplay(areaGrids[area][index] || "")}
                                  onChange={(e) => updateGridCell(area, index, e.target.value)}
                                  inputProps={{ style: { textAlign: "center" }, maxLength: 2 }}
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            ))}
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

          <Box mt={4} display="flex" justifyContent="space-between">
            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/workorder/create/embroidery")}
            >
              Back
            </Button>
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
