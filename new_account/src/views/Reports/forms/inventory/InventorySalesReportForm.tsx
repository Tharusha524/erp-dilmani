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
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { useApplyFiscalYearDates } from "../../../../hooks/useApplyFiscalYearDates";
import { getInventoryLocations, InventoryLocation } from "../../../../api/InventoryLocation/InventoryLocationApi";

interface Customer {
    debtor_no: number;
    name: string;
    // Add other fields as needed
}

interface InventorySalesReportFormData {
    startDate: string;
    endDate: string;
    itemCategory: string;
    location: string;
    customer: string;
    showServiceItems: string;
    comments: string;
    orientation: string;
    destination: string;
}

export default function InventorySalesReportForm() {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    const [formData, setFormData] = useState<InventorySalesReportFormData>({
        startDate: "",
        endDate: "",
        itemCategory: "NoFilter",
        location: "NoFilter",
        customer: "NoFilter",
        showServiceItems: "No",
        comments: "",
        orientation: "Portrait",
        destination: "Print",
    });

    useApplyFiscalYearDates(setFormData, {
        startDate: "startDate",
        endDate: "endDate",
    });

    const [errors, setErrors] = useState<Partial<InventorySalesReportFormData>>({});
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [itemCategories, setItemCategories] = useState<any[]>([]);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersData, itemCategoriesData, locationsData] = await Promise.all([
                    getCustomers(),
                    getItemCategories(),
                    getInventoryLocations(),
                ]);
                setCustomers(customersData);
                setItemCategories(itemCategoriesData);
                setLocations(locationsData);
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
        let newErrors: Partial<InventorySalesReportFormData> = {};

        if (!formData.startDate) newErrors.startDate = "Start date is required";
        if (!formData.endDate) newErrors.endDate = "End date is required";
        if (!formData.customer) newErrors.customer = "Customer is required";

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

                    <TextField
                        label="Invemtory Category"
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

                    {/* Customer dropdown */}
                    <TextField
                        label="Customer"
                        name="customer"
                        size="small"
                        fullWidth
                        select
                        value={formData.customer}
                        onChange={handleChange}
                        error={!!errors.customer}
                        helperText={errors.customer}
                    >
                        <MenuItem value="NoFilter">No customer filter</MenuItem>
                        {customers.map((customer) => (
                            <MenuItem key={customer.debtor_no} value={customer.debtor_no.toString()}>
                                {customer.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Show balance dropdown */}
                    <TextField
                        label="Show Service Items"
                        name="showServiceItems"
                        size="small"
                        fullWidth
                        select
                        value={formData.showServiceItems}
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
