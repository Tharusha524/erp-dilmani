import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useState, useEffect } from "react";
import {
    Box,
    Stack,
    Typography,
    TextField,
    Button,
    MenuItem,
    Paper,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import { getSuppliers } from "../../../../api/Supplier/SupplierApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { getInventoryLocations, InventoryLocation } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { useApplyFiscalYearDates } from "../../../../hooks/useApplyFiscalYearDates";
import { getItems } from "../../../../api/Item/ItemApi";

interface Supplier {
  supplier_id: number;
  supp_name: string;
  // Add other fields as needed
}

interface InventoryPurchasingReportFormData {
    startDate: string;
    endDate: string;
    itemCategory: string;
    location: string;
    supplier: string;
    item: string;
    comments: string;
    orientation: string;
    destination: string;
}

export default function InventoryPurchasingReportForm() {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    const [formData, setFormData] = useState<InventoryPurchasingReportFormData>({
        startDate: "",
        endDate: "",
        itemCategory: "NoFilter",
        location: "NoFilter",
        supplier: "NoFilter",
        item: "NoFilter",
        comments: "",
        orientation: "Portrait",
        destination: "Print",
    });

    useApplyFiscalYearDates(setFormData, {
        startDate: "startDate",
        endDate: "endDate",
    });

    const [errors, setErrors] = useState<Partial<InventoryPurchasingReportFormData>>({});
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [itemCategories, setItemCategories] = useState<any[]>([]);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [suppliersData, itemCategoriesData, locationsData, itemsData] = await Promise.all([
                    getSuppliers(),
                    getItemCategories(),
                    getInventoryLocations(),
                    getItems(),
                ]);
                setSuppliers(suppliersData);
                setItemCategories(itemCategoriesData);
                setLocations(locationsData);
                setItems(itemsData);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Simple validation
    const validate = () => {
        let newErrors: Partial<InventoryPurchasingReportFormData> = {};

        if (!formData.startDate) newErrors.startDate = "Start date is required";
        if (!formData.endDate) newErrors.endDate = "End date is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const runReportPdf = useReportGenerate({ validate });
  const handleGenerate = () => {
    void runReportPdf(formData);
  };

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <FormPageLayout>
            <Paper
                sx={{
                    p: 3,
                    maxWidth: "650px",
                    width: "100%",
                    boxShadow: 2,
                    borderRadius: 2,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{ mb: 3, textAlign: isMobile ? "center" : "left" }}
                >
                    Inventory Purchasing Report
                </Typography>

                <Stack spacing={2}>
                    {/* Dates */}
                    <TextField
                        label="Start Date"
                        type="date"
                        name="startDate"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={formData.startDate}
                        onChange={handleChange}
                        error={!!errors.startDate}
                        helperText={errors.startDate}
                    />

                    <TextField
                        label="End Date"
                        type="date"
                        name="endDate"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={formData.endDate}
                        onChange={handleChange}
                        error={!!errors.endDate}
                        helperText={errors.endDate}
                    />

                    <TextField
                        label="Inventory Category"
                        name="itemCategory"
                        size="small"
                        fullWidth
                        select
                        value={formData.itemCategory}
                        onChange={handleChange}
                    >
                        <MenuItem value="NoFilter">No category filter</MenuItem>
                        {itemCategories.map((category) => (
                            <MenuItem key={category.category_id} value={category.category_id}>
                                {category.description}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Location dropdown */}
                    <TextField
                        label="Location"
                        name="location"
                        size="small"
                        fullWidth
                        select
                        value={formData.location}
                        onChange={handleChange}
                    >
                        <MenuItem value="NoFilter">No location filter</MenuItem>
                        {locations.map((location) => (
                            <MenuItem key={location.loc_code} value={location.loc_code}>
                                {location.location_name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Supplier dropdown */}
                    <TextField
                        label="Supplier"
                        name="supplier"
                        size="small"
                        fullWidth
                        select
                        value={formData.supplier}
                        onChange={handleChange}
                        error={!!errors.supplier}
                        helperText={errors.supplier}
                    >
                        <MenuItem value="NoFilter">No supplier filter</MenuItem>
                        {suppliers.map((supplier) => (
                            <MenuItem key={supplier.supplier_id} value={supplier.supplier_id}>
                                {supplier.supp_name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Item dropdown */}
                    <TextField
                        label="Item"
                        name="item"
                        size="small"
                        fullWidth
                        select
                        value={formData.item}
                        onChange={handleChange}
                    >
                        <MenuItem value="NoFilter">All items</MenuItem>
                        {items.map((item) => (
                            <MenuItem key={item.stock_id} value={item.stock_id}>
                                {item.description}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Item Code display */}
                    <TextField
                        label="Item Code"
                        size="small"
                        fullWidth
                        value={formData.item !== "NoFilter" ? formData.item : ""}
                        InputProps={{ readOnly: true }}
                    />

                    {/* Comments */}
                    <TextField
                        label="Comments"
                        name="comments"
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                        value={formData.comments}
                        onChange={handleChange}
                    />

                    {/* Orientation */}
                    <TextField
                        label="Orientation"
                        name="orientation"
                        size="small"
                        fullWidth
                        select
                        value={formData.orientation}
                        onChange={handleChange}
                    >
                        <MenuItem value="Portrait">Portrait</MenuItem>
                        <MenuItem value="Landscape">Landscape</MenuItem>
                    </TextField>

                    {/* Destination */}
                    <TextField
                        label="Destination"
                        name="destination"
                        size="small"
                        fullWidth
                        select
                        value={formData.destination}
                        onChange={handleChange}
                    >
                        <MenuItem value="Print">PDF/Printer</MenuItem>
                        <MenuItem value="Excel">Excel</MenuItem>
                    </TextField>
                </Stack>

                {/* Buttons */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 3,
                        flexDirection: isMobile ? "column" : "row",
                        gap: isMobile ? 2 : 0,
                    }}
                >
                    <Button onClick={() => window.history.back()}>Back</Button>

                    <Button
                        variant="contained"
                        fullWidth={isMobile}
                        sx={{ backgroundColor: "var(--pallet-blue)" }}
                        onClick={handleGenerate}
                    >
                        Generate
                    </Button>
                </Box>
            </Paper>
        </FormPageLayout>
    );
}
