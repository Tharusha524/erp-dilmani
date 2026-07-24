import React, { useState } from "react";
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
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { enqueueSnackbar } from "notistack";
import { createWorkOrder } from "../../api/WorkOrder/workOrderApi";

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

const AddWorkOrder = () => {
  const navigate = useNavigate();

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
  const [embroider, setEmbroider] = useState({ front: "", back: "", sleeves: "", others: "" });
  const [totalPrice, setTotalPrice] = useState("");
  const [advance, setAdvance] = useState("");
  const [balance, setBalance] = useState("");

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
    mutationFn: (formData: FormData) => createWorkOrder(formData),
    onSuccess: () => {
      enqueueSnackbar("Work order created successfully!", { variant: "success" });
      navigate("/workorder/dashboard");
    },
    onError: () => {
      enqueueSnackbar("Failed to create work order", { variant: "error" });
    },
  });

  const handleSubmit = () => {
    if (!category) {
      enqueueSnackbar("Please select a garment category", { variant: "warning" });
      return;
    }

    const formData = new FormData();
    formData.append("category", category);
    formData.append("branch", branch);
    formData.append("order_date", orderDate);
    formData.append("delivery_date", deliveryDate);
    formData.append("customer", customer);
    formData.append("contact_no", contactNo);
    formData.append("kind_of_fabric", kindOfFabric);
    formData.append("remark", remark);
    formData.append("order_quantity", String(totalOrderQuantity));
    formData.append("embroider_front", embroider.front);
    formData.append("embroider_back", embroider.back);
    formData.append("embroider_sleeves", embroider.sleeves);
    formData.append("embroider_others", embroider.others);
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
                    type="number"
                    fullWidth
                    value={sizeQty[sizeKey(category, size)] || ""}
                    onChange={(e) =>
                      setSizeQty((prev) => ({ ...prev, [sizeKey(category, size)]: e.target.value }))
                    }
                    inputProps={{ min: 0, style: { textAlign: "center" } }}
                  />
                </TableCell>
              ))}
              <TableCell align="center" padding="none">
                <TextField
                  variant="outlined"
                  size="small"
                  type="number"
                  fullWidth
                  value={groupTotal(category, sizes)}
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
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: "1200px", margin: "0 auto" }}>
        <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
          ORDER SHEET
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
              label="Kind of Fabric"
              size="small"
              margin="normal"
              value={kindOfFabric}
              onChange={(e) => setKindOfFabric(e.target.value)}
            />
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
              label="Branch"
              size="small"
              margin="normal"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
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
                          type="number"
                          fullWidth
                          variant="outlined"
                          value={prices[item] || ""}
                          onChange={(e) => setPrices((prev) => ({ ...prev, [item]: e.target.value }))}
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
                    <TableCell sx={{ fontWeight: "bold" }} colSpan={2}>EMBROIDER DETAILS :</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(["front", "back", "sleeves", "others"] as const).map((key) => (
                    <TableRow key={key}>
                      <TableCell>{key.toUpperCase()}</TableCell>
                      <TableCell padding="none">
                        <TextField
                          size="small"
                          fullWidth
                          variant="outlined"
                          value={embroider[key]}
                          onChange={(e) => setEmbroider((prev) => ({ ...prev, [key]: e.target.value }))}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>TOTAL PRICE</TableCell>
                    <TableCell padding="none">
                      <TextField size="small" type="number" fullWidth variant="outlined" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>ADVANCE</TableCell>
                    <TableCell padding="none">
                      <TextField size="small" type="number" fullWidth variant="outlined" value={advance} onChange={(e) => setAdvance(e.target.value)} />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>BALANCE</TableCell>
                    <TableCell padding="none">
                      <TextField size="small" type="number" fullWidth variant="outlined" value={balance} onChange={(e) => setBalance(e.target.value)} />
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
            Add Work Order
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AddWorkOrder;
