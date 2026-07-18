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
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getCurrencies, Currency } from "../../../../api/Currency/currencyApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { getSalesTypes  } from "../../../../api/SalesMaintenance/salesService";

interface Customer {
    debtor_no: number;
    name: string;
    // Add other fields as needed
}

interface CustomerBalancesFormData {
    currencyFilter: string;
    inventoryCategory: string;
    salesType: string;
    showPictures: string;
    showGP: string;
    comments: string;
    orientation: string;
    destination: string;
}

export default function CustomerBalancesForm() {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    const [formData, setFormData] = useState<CustomerBalancesFormData>({
        currencyFilter: "NoFilter",
        inventoryCategory: "NoFilter",
        salesType: "",
        showPictures: "No",
        showGP: "No",
        comments: "",
        orientation: "Portrait",
        destination: "Print",
    });

    const [errors, setErrors] = useState<Partial<CustomerBalancesFormData>>({});
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [itemCategories, setItemCategories] = useState<any[]>([]);
    const [salesTypes, setSalesTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersData, currenciesData, itemCategoriesData, salesTypesData] = await Promise.all([
                    getCustomers(),
                    getCurrencies(),
                    getItemCategories(),
                    getSalesTypes(),
                ]);
                setCustomers(customersData);
                setCurrencies(currenciesData);
                setItemCategories(itemCategoriesData);
                setSalesTypes(salesTypesData);
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
        let newErrors: Partial<CustomerBalancesFormData> = {};

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
                    Customer Balances Report
                </Typography>

                <Stack spacing={2}>

                    {/* Currency Filter */}
                    <TextField
                        label="Currency Filter"
                        name="currencyFilter"
                        size="small"
                        fullWidth
                        select
                        value={formData.currencyFilter}
                        onChange={handleChange}
                    >
                        <MenuItem value="NoFilter">No currency filter</MenuItem>
                        {currencies.map((currency) => (
                            <MenuItem key={currency.id} value={currency.currency_abbreviation}>
                                {currency.currency_abbreviation} - {currency.currency_name}
                            </MenuItem>
                        ))}
                    </TextField>

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

                    <TextField
                        label="Sales Type"
                        name="salesType"
                        size="small"
                        fullWidth
                        select
                        value={formData.salesType}
                        onChange={handleChange}
                    >
                        {salesTypes.map((salesType) => (
                            <MenuItem key={salesType.id} value={salesType.id}>
                                {salesType.typeName}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Show Pictures */}
                    <TextField
                        label="Show Pictures"
                        name="showPictures"
                        size="small"
                        fullWidth
                        select
                        value={formData.showPictures}
                        onChange={handleChange}
                    >
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                    </TextField>

                    <TextField
                        label="Show GP %"
                        name="showGP"
                        size="small"
                        fullWidth
                        select
                        value={formData.showGP}
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
        </FormPageLayout>
    );
}
