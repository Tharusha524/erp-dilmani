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
  MenuItem,
  CircularProgress,
  Checkbox,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormPageLayout } from "../../components/Layout/FormPageLayout";
import { useNavigate, useSearchParams } from "react-router";
import { enqueueSnackbar } from "notistack";
import { createWorkOrder, getWorkOrder, updateWorkOrder } from "../../api/WorkOrder/workOrderApi";
import { getWoSheetBranches, getWoSheetFabricTypes } from "../../api/WorkOrder/workOrderLookupsApi";
import { cleanWoNumberInput, formatWoNumberInputDisplay, formatWoQuantity } from "../../utils/workOrderNumberFormat";
import { getApiBaseUrl } from "../../config/backendConfig";

const CATEGORY_OPTIONS = [
  { value: "sublimation_tshirt", label: "Sublimation T-Shirt" },
  { value: "polo_tshirt", label: "Polo T-Shirt" },
];

const SIZE_GROUPS: { title: string; category: string; sizes: string[] }[] = [
  { title: "GENTS SIZE", category: "GENTS", sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"] },
  { title: "LADIES SIZE", category: "LADIES", sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"] },
  { title: "BOYS SIZE", category: "BOYS", sizes: ["4", "5", "6", "7"] },
  { title: "PRESCHOOL SIZE", category: "PRESCHOOL", sizes: ["S", "M", "L", "XL"] },
];

const PRICE_ITEM_NAMES = ["ELDERS", "PRESCHOOL", "BOYS", "SHORTS", "BOTTOM", "SKINEE", "JACKET"];

const storageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  const apiBase = getApiBaseUrl().replace(/\/+$/, "");
  const backendBase = apiBase.replace(/\/index\.php\/api$/i, "").replace(/\/api$/i, "");
  return `${backendBase}/storage/${path.replace(/^\/+/, "")}`;
};

const parseEmbroiderSide = (value?: string | null) => ({
  left: !!value?.includes("Left"),
  right: !!value?.includes("Right"),
});

const AddWorkOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("editId");
  const isEditing = !!editId;
  const department = searchParams.get("department") || "Factory";

  const { data: existingOrder } = useQuery({
    queryKey: ["wo-sheet-order", editId],
    queryFn: () => getWorkOrder(editId as string),
    enabled: isEditing,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["wo-sheet-branches"],
    queryFn: getWoSheetBranches,
  });
  const { data: fabricTypes = [] } = useQuery({
    queryKey: ["wo-sheet-fabric-types"],
    queryFn: getWoSheetFabricTypes,
  });

  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);

  const [category, setCategory] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [customer, setCustomer] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [kindOfFabric, setKindOfFabric] = useState("");
  const [branch, setBranch] = useState("");
  const [remark, setRemark] = useState("");

  const [sizeQty, setSizeQty] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [embroider, setEmbroider] = useState({
    front: { left: false, right: false },
    back: { left: false, right: false },
    sleeves: { left: false, right: false },
  });
  const [embroiderOthers, setEmbroiderOthers] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [advance, setAdvance] = useState("");
  const [balance, setBalance] = useState("");

  useEffect(() => {
    if (!existingOrder) return;
    setCategory(existingOrder.category || "");
    setOrderDate(existingOrder.order_date?.slice(0, 10) || "");
    setDeliveryDate(existingOrder.delivery_date?.slice(0, 10) || "");
    setCustomer(existingOrder.customer || "");
    setContactNo(existingOrder.contact_no || "");
    setKindOfFabric(existingOrder.kind_of_fabric || "");
    setBranch(existingOrder.branch || "");
    setRemark(existingOrder.remark || "");
    setEmbroider({
      front: parseEmbroiderSide(existingOrder.embroider_front),
      back: parseEmbroiderSide(existingOrder.embroider_back),
      sleeves: parseEmbroiderSide(existingOrder.embroider_sleeves),
    });
    setEmbroiderOthers(existingOrder.embroider_others || "");
    setTotalPrice(existingOrder.total_price != null ? String(existingOrder.total_price) : "");
    setAdvance(existingOrder.advance != null ? String(existingOrder.advance) : "");
    setBalance(existingOrder.balance != null ? String(existingOrder.balance) : "");
    setFrontImagePreview(storageUrl(existingOrder.front_image_path));
    setBackImagePreview(storageUrl(existingOrder.back_image_path));

    const nextSizeQty: Record<string, string> = {};
    existingOrder.sizes?.forEach((s) => {
      nextSizeQty[`${s.category}-${s.size_label}`] = String(s.quantity);
    });
    setSizeQty(nextSizeQty);

    const nextPrices: Record<string, string> = {};
    existingOrder.price_items?.forEach((p) => {
      nextPrices[p.item_name] = String(p.price);
    });
    setPrices(nextPrices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingOrder]);

  const sizeKey = (category: string, size: string) => `${category}-${size}`;

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const groupTotal = (category: string, sizes: string[]) =>
    sizes.reduce((sum, size) => sum + (parseInt(sizeQty[sizeKey(category, size)] || "0", 10) || 0), 0);

  const totalOrderQuantity = SIZE_GROUPS.reduce(
    (sum, group) => sum + groupTotal(group.category, group.sizes),
    0
  );

  const { mutate: submitWorkOrder, isPending } = useMutation({
    mutationFn: (formData: FormData) =>
      isEditing ? updateWorkOrder(editId as string, formData) : createWorkOrder(formData),
    onSuccess: () => {
      enqueueSnackbar(isEditing ? "Work order updated successfully!" : "Work order created successfully!", {
        variant: "success",
      });
      navigate("/workorder/dashboard");
    },
    onError: () => {
      enqueueSnackbar(isEditing ? "Failed to update work order" : "Failed to create work order", {
        variant: "error",
      });
    },
  });

  const handleSubmit = () => {
    if (!category) {
      enqueueSnackbar("Please select a garment category", { variant: "warning" });
      return;
    }

    const formData = new FormData();
    formData.append("category", category);
    formData.append("department", department);
    formData.append("branch", branch);
    formData.append("order_date", orderDate);
    formData.append("delivery_date", deliveryDate);
    formData.append("customer", customer);
    formData.append("contact_no", contactNo);
    formData.append("kind_of_fabric", kindOfFabric);
    formData.append("remark", remark);
    formData.append("order_quantity", String(totalOrderQuantity));
    const embroiderLabel = (side: { left: boolean; right: boolean }) =>
      [side.left && "Left", side.right && "Right"].filter(Boolean).join(", ");
    formData.append("embroider_front", embroiderLabel(embroider.front));
    formData.append("embroider_back", embroiderLabel(embroider.back));
    formData.append("embroider_sleeves", embroiderLabel(embroider.sleeves));
    formData.append("embroider_others", embroiderOthers);
    if (totalPrice) formData.append("total_price", totalPrice);
    if (advance) formData.append("advance", advance);
    if (balance) formData.append("balance", balance);
    if (frontImageFile) formData.append("front_image", frontImageFile);
    if (backImageFile) formData.append("back_image", backImageFile);

    let sizeIndex = 0;
    SIZE_GROUPS.forEach((group) => {
      group.sizes.forEach((size) => {
        const qty = sizeQty[sizeKey(group.category, size)];
        if (qty && parseInt(qty, 10) > 0) {
          formData.append(`sizes[${sizeIndex}][category]`, group.category);
          formData.append(`sizes[${sizeIndex}][size_label]`, size);
          formData.append(`sizes[${sizeIndex}][quantity]`, qty);
          sizeIndex += 1;
        }
      });
    });

    let priceIndex = 0;
    PRICE_ITEM_NAMES.forEach((item) => {
      const price = prices[item];
      if (price) {
        formData.append(`price_items[${priceIndex}][item_name]`, item);
        formData.append(`price_items[${priceIndex}][price]`, price);
        priceIndex += 1;
      }
    });

    submitWorkOrder(formData);
  };

  const renderSizeGrid = (title: string, category: string, sizes: string[]) => (
    <Box mt={3}>
      <Typography variant="subtitle2" gutterBottom fontWeight="bold" align="center">
        {title}
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {sizes.map((size) => (
                <TableCell key={size} align="center" sx={{ fontWeight: "bold" }}>
                  {size}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {sizes.map((size) => (
                <TableCell key={`${category}-${size}`} align="center" padding="none">
                  <TextField
                    variant="outlined"
                    size="small"
                    type="text"
                    inputMode="numeric"
                    fullWidth
                    value={formatWoNumberInputDisplay(sizeQty[sizeKey(category, size)] || "")}
                    onChange={(e) =>
                      setSizeQty((prev) => ({
                        ...prev,
                        [sizeKey(category, size)]: cleanWoNumberInput(e.target.value),
                      }))
                    }
                    inputProps={{ style: { textAlign: "center" } }}
                  />
                </TableCell>
              ))}
              <TableCell align="center" padding="none">
                <TextField
                  variant="outlined"
                  size="small"
                  type="text"
                  fullWidth
                  value={formatWoQuantity(groupTotal(category, sizes))}
                  InputProps={{ readOnly: true }}
                  inputProps={{ style: { textAlign: "center", fontWeight: "bold" } }}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <FormPageLayout>
      <Box p={3}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: "1200px", margin: "0 auto" }}>
          <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
            ORDER SHEET
          </Typography>
          <Typography variant="subtitle2" align="center" color="text.secondary" gutterBottom>
            {department} Work Order
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Header Information */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Category"
                size="small"
                margin="normal"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Delivery Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                size="small"
                margin="normal"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
              <TextField
                fullWidth
                label="Customer"
                size="small"
                margin="normal"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
              <TextField
                fullWidth
                select
                label="Kind of Fabric"
                size="small"
                margin="normal"
                value={kindOfFabric}
                onChange={(e) => setKindOfFabric(e.target.value)}
              >
                {fabricTypes.map((opt) => (
                  <MenuItem key={opt.id} value={opt.name}>
                    {opt.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                size="small"
                margin="normal"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
              <TextField
                fullWidth
                label="Contact No"
                size="small"
                margin="normal"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
              />
              <TextField
                fullWidth
                select
                label="Branch"
                size="small"
                margin="normal"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                {branches.map((opt) => (
                  <MenuItem key={opt.id} value={opt.name}>
                    {opt.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Design Upload Section */}
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={6}>
              <Paper
                variant="outlined"
                sx={{
                  height: 300,
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
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setFrontImageFile, setFrontImagePreview)}
                />
                {frontImagePreview ? (
                  <img src={frontImagePreview} alt="Front Design" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <>
                    <CloudUploadIcon color="action" sx={{ fontSize: 60, mb: 1 }} />
                    <Typography color="textSecondary">Upload Front Design</Typography>
                  </>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper
                variant="outlined"
                sx={{
                  height: 300,
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
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setBackImageFile, setBackImagePreview)}
                />
                {backImagePreview ? (
                  <img src={backImagePreview} alt="Back Design" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <>
                    <CloudUploadIcon color="action" sx={{ fontSize: 60, mb: 1 }} />
                    <Typography color="textSecondary">Upload Back Design</Typography>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Size Grids */}
          {SIZE_GROUPS.slice(0, 2).map((group) => renderSizeGrid(group.title, group.category, group.sizes))}

          <Grid container spacing={3}>
            {SIZE_GROUPS.slice(2).map((group) => (
              <Grid item xs={12} md={6} key={group.category}>
                {renderSizeGrid(group.title, group.category, group.sizes)}
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Remarks and Pricing Details */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>REMARK</Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                variant="outlined"
                placeholder="Enter any additional remarks here..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>ITEMS</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>PRICES</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {PRICE_ITEM_NAMES.map((item) => (
                      <TableRow key={item}>
                        <TableCell>{item}</TableCell>
                        <TableCell padding="none">
                          <TextField
                            size="small"
                            type="text"
                            inputMode="decimal"
                            fullWidth
                            variant="outlined"
                            value={formatWoNumberInputDisplay(prices[item] || "")}
                            onChange={(e) =>
                              setPrices((prev) => ({ ...prev, [item]: cleanWoNumberInput(e.target.value) }))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} md={3}>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }} colSpan={3}>EMBROIDER DETAILS :</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell />
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>Left</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>Right</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(["front", "back", "sleeves"] as const).map((key) => (
                      <TableRow key={key}>
                        <TableCell>{key.toUpperCase()}</TableCell>
                        <TableCell padding="none" align="center">
                          <Checkbox
                            checked={embroider[key].left}
                            onChange={(e) =>
                              setEmbroider((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], left: e.target.checked },
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell padding="none" align="center">
                          <Checkbox
                            checked={embroider[key].right}
                            onChange={(e) =>
                              setEmbroider((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], right: e.target.checked },
                              }))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell>OTHERS</TableCell>
                      <TableCell padding="none" colSpan={2}>
                        <TextField
                          size="small"
                          fullWidth
                          variant="outlined"
                          value={embroiderOthers}
                          onChange={(e) => setEmbroiderOthers(e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>TOTAL PRICE</TableCell>
                      <TableCell padding="none">
                        <TextField
                          size="small"
                          type="text"
                          inputMode="decimal"
                          fullWidth
                          variant="outlined"
                          value={formatWoNumberInputDisplay(totalPrice)}
                          onChange={(e) => setTotalPrice(cleanWoNumberInput(e.target.value))}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>ADVANCE</TableCell>
                      <TableCell padding="none">
                        <TextField
                          size="small"
                          type="text"
                          inputMode="decimal"
                          fullWidth
                          variant="outlined"
                          value={formatWoNumberInputDisplay(advance)}
                          onChange={(e) => setAdvance(cleanWoNumberInput(e.target.value))}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>BALANCE</TableCell>
                      <TableCell padding="none">
                        <TextField
                          size="small"
                          type="text"
                          inputMode="decimal"
                          fullWidth
                          variant="outlined"
                          value={formatWoNumberInputDisplay(balance)}
                          onChange={(e) => setBalance(cleanWoNumberInput(e.target.value))}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
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

export default AddWorkOrder;
