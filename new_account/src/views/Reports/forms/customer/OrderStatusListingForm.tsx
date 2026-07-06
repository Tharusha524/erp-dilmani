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
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getCurrencies, Currency } from "../../../../api/Currency/currencyApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { useApplyFiscalYearDates } from "../../../../hooks/useApplyFiscalYearDates";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";

interface Customer {
    debtor_no: number;
    name: string;
    // Add other fields as needed
}

interface OrderStatusListingFormData {
    startDate: string;
    endDate: string;
    inventoryCategory: string;
    stockLocation: string;
    bankOrders: string;
    comments: string;
    orientation: string;
    destination: string;
}

export default function OrderStatusListingForm() {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    const [formData, setFormData] = useState<OrderStatusListingFormData>({
        startDate: "",
        endDate: "",
        inventoryCategory: "NoFilter",
        stockLocation: "NoFilter",
        bankOrders: "No",
        comments: "",
        orientation: "Portrait",
        destination: "Print",
    });

    useApplyFiscalYearDates(setFormData, {
        startDate: "startDate",
        endDate: "endDate",
    });

    const [errors, setErrors] = useState<Partial<OrderStatusListingFormData>>({});
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [itemCategories, setItemCategories] = useState<any[]>([]);
    const [inventoryLocations, setInventoryLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersData, currenciesData, itemCategoriesData, inventoryLocationsData] = await Promise.all([
                    getCustomers(),
                    getCurrencies(),
                    getItemCategories(),
                    getInventoryLocations(),
                ]);
                setCustomers(customersData);
                setCurrencies(currenciesData);
                setItemCategories(itemCategoriesData);
                setInventoryLocations(inventoryLocationsData);
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
        let newErrors: Partial<OrderStatusListingFormData> = {};

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
        <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
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
                    Customer Balances Report
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

                    {/* Inventory Category dropdown */}
                    <TextField
                        label="Inventory Category"
                        name="inventoryCategory"
                        size="small"
                        fullWidth
                        select
                        value={formData.inventoryCategory}
                        onChange={handleChange}
                    >
                        <MenuItem value="NoFilter">No Category Filter</MenuItem>
                        {itemCategories.map((itemCategory) => (
                            <MenuItem key={itemCategory.category_id} value={itemCategory.category_id}>
                                {itemCategory.description}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Stock Location Filter */}
                    <TextField
                        label="Stock Location"
                        name="currencyFilter"
                        size="small"
                        fullWidth
                        select
                        value={formData.stockLocation}
                        onChange={handleChange}
                    >
                        <MenuItem value="NoFilter">No Location Filter</MenuItem>
                        {inventoryLocations.map((location) => (
                            <MenuItem key={location.id} value={location.location_code}>
                                {location.location_name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Suppress Zeros */}
                    <TextField
                        label="Bank Orders Only"
                        name="bankOrders"
                        size="small"
                        fullWidth
                        select
                        value={formData.bankOrders}
                        onChange={handleChange}
                    >
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                    </TextField>

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
        </Stack>
    );
}
