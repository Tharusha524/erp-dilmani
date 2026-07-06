import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  FormHelperText,
  SelectChangeEvent,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import theme from "../../../../../theme";
import { getSuppliers } from "../../../../../api/Supplier/SupplierApi";
import { createPurchData, PurchData } from "../../../../../api/PurchasingPricing/PurchasingPricingApi";
import AddedConfirmationModal from "../../../../../components/AddedConfirmationModal";
import ErrorModal from "../../../../../components/ErrorModal";
interface Supplier {
  supplier_id: number;
  supp_name: string;
}

interface PurchasingPricingFormData {
  supplier: string;
  price: string;
  supplierUOM: string;
  conversionFactor: string;
  supplierCode: string;
}

interface AddPurchasingPricingFormProps {
  itemId?: string | number;
}

export default function AddPurchasingPricingForm({ itemId }: AddPurchasingPricingFormProps) {
  const params = useParams();
  const actualItemId = itemId || params.itemId;
  const [formData, setFormData] = useState<PurchasingPricingFormData>({
    supplier: "",
    price: "",
    supplierUOM: "",
    conversionFactor: "",
    supplierCode: "",
  });

  const [errors, setErrors] = useState<Partial<PurchasingPricingFormData>>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [open, setOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const suppliersData = await getSuppliers();
        setSuppliers(suppliersData);
      } catch (error) {
        setErrorMessage("Failed to fetch suppliers. Please try again.");
        setErrorOpen(true);
        console.error("Failed to fetch suppliers:", error);
      }
    };

    fetchSuppliers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const newErrors: Partial<PurchasingPricingFormData> = {};
    if (!formData.supplier) newErrors.supplier = "Supplier is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (!formData.supplierUOM) newErrors.supplierUOM = "Supplier UOM is required";
    if (!formData.conversionFactor) newErrors.conversionFactor = "Conversion factor is required";
    if (!formData.supplierCode) newErrors.supplierCode = "Supplier code/description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      try {
        const purchData: PurchData = {
          supplier_id: parseInt(formData.supplier),
          stock_id: actualItemId as string,
          price: parseFloat(formData.price),
          suppliers_uom: formData.supplierUOM,
          conversion_factor: parseFloat(formData.conversionFactor),
          supplier_description: formData.supplierCode,
        };

        await createPurchData(purchData);

        console.log("Purchasing Pricing Submitted:", purchData);
        setOpen(true);

        // Reset form
        setFormData({
          supplier: "",
          price: "",
          supplierUOM: "",
          conversionFactor: "",
          supplierCode: "",
        });
      } catch (error) {
        console.error("Failed to save purchasing pricing:", error);
        setErrorMessage("Failed to save purchasing pricing. Please try again.");
        setErrorOpen(true);
      }
    }
  };

  return (
    <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
      <Paper
        sx={{
          p: theme.spacing(3),
          maxWidth: "500px",
          width: "100%",
          boxShadow: 2,
          borderRadius: 2,
        }}
      >
        <Stack spacing={2}>
          {/* Supplier Dropdown */}
          <FormControl size="small" fullWidth error={!!errors.supplier}>
            <InputLabel>Supplier</InputLabel>
            <Select
              name="supplier"
              value={formData.supplier}
              onChange={handleSelectChange}
              label="Supplier"
            >
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.supp_name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.supplier}</FormHelperText>
          </FormControl>

          {/* Price */}
          <TextField
            label="Price (USD)"
            name="price"
            size="small"
            fullWidth
            type="number"
            value={formData.price}
            onChange={handleInputChange}
            error={!!errors.price}
            helperText={errors.price}
          />

          {/* Supplier UOM */}
          <TextField
            label="Supplier Units of Measure"
            name="supplierUOM"
            size="small"
            fullWidth
            value={formData.supplierUOM}
            onChange={handleInputChange}
            error={!!errors.supplierUOM}
            helperText={errors.supplierUOM}
          />

          {/* Conversion Factor */}
          <TextField
            label="Conversion Factor (to our UOM)"
            name="conversionFactor"
            size="small"
            fullWidth
            type="number"
            value={formData.conversionFactor}
            onChange={handleInputChange}
            error={!!errors.conversionFactor}
            helperText={errors.conversionFactor}
          />

          {/* Supplier Code / Description */}
          <TextField
            label="Supplier's Code or Description"
            name="supplierCode"
            size="small"
            fullWidth
            value={formData.supplierCode}
            onChange={handleInputChange}
            error={!!errors.supplierCode}
            helperText={errors.supplierCode}
          />
        </Stack>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 3,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 2 : 0,
          }}
        >
          <Button onClick={() => navigate("/itemsandinventory/maintenance/items/")}>
            Back
          </Button>

          <Button
            variant="contained"
            fullWidth={isMobile}
            sx={{ backgroundColor: "var(--pallet-blue)" }}
            onClick={handleSubmit}
          >
            Add Pricing
          </Button>
        </Box>
      </Paper>
      <AddedConfirmationModal
        open={open}
        title="Success"
        content="This supplier purchasing data has been added!"
        addFunc={async () => { }}
        handleClose={() => setOpen(false)}
        onSuccess={() => navigate("/itemsandinventory/maintenance/items/", {
          state: { tab: 2, selectedItem: actualItemId }
        })}
      />
      <ErrorModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        message={errorMessage}
      />
    </Stack>
  );
}
