import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useState, useEffect } from "react";
import { useApplyFiscalYearDates } from "../../../../hooks/useApplyFiscalYearDates";
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
import { getSalesAreas, SalesArea } from "../../../../api/SalesMaintenance/salesService";
import { getSalesPersons, SalesPerson } from "../../../../api/SalesPerson/SalesPersonApi";
import { generateCustomerDetailListingReport } from "../../../../api/Reports/ReportsApi";
import { useSnackbar } from "notistack";

interface Customer {
    debtor_no: number;
    name: string;
    // Add other fields as needed
}

interface CustomerDetailListingFormData {
    startDate: string;
    salesArea: string;
    salesFolk: string;
    actGreaterThan: string;
    actLessThan: string;
    comments: string;
    orientation: string;
    destination: string;
}

export default function CustomerDetailListingForm() {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
    const { enqueueSnackbar } = useSnackbar();

    const [formData, setFormData] = useState<CustomerDetailListingFormData>({
        startDate: "",
        salesArea: "NoFilter",
        salesFolk: "NoFilter",
        actGreaterThan: "",
        actLessThan: "",
        comments: "",
        orientation: "Portrait",
        destination: "Print",
    });

    useApplyFiscalYearDates(setFormData, { startDate: "startDate" });

    const [errors, setErrors] = useState<Partial<CustomerDetailListingFormData>>({});
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [salesAreas, setSalesAreas] = useState<SalesArea[]>([]);
    const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersData, currenciesData, salesAreasData, salesPeopleData] = await Promise.all([
                    getCustomers(),
                    getCurrencies(),
                    getSalesAreas(),
                    getSalesPersons(),
                ]);
                setCustomers(customersData);
                setCurrencies(currenciesData);
                setSalesAreas(salesAreasData);
                setSalesPeople(salesPeopleData);
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
        let newErrors: Partial<CustomerDetailListingFormData> = {};

        if (!formData.startDate) newErrors.startDate = "Activity Since date is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGenerate = async () => {
        if (!validate()) return;

        try {
            const blob = await generateCustomerDetailListingReport({
                activitySince: formData.startDate,
                salesArea: formData.salesArea,
                salesFolk: formData.salesFolk,
                greaterThan: formData.actGreaterThan,
                lessThan: formData.actLessThan
            });
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `customer_detail_listing_${formData.startDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            enqueueSnackbar("Report generated successfully", { variant: "success" });
        } catch (error) {
            console.error("Failed to generate report:", error);
            enqueueSnackbar("Failed to generate report", { variant: "error" });
        }
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
                    {/* Dates */}
                    <TextField
                        label="Activity Since"
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

                    {/* Sales Area dropdown */}
                    <TextField
                        label="Sales Area"
                        name="salesArea"
                        size="small"
                        fullWidth
                        select
                        value={formData.salesArea}
                        onChange={handleChange}
                    >
                        <MenuItem value="NoFilter">No Area filter</MenuItem>
                        {salesAreas.map((area) => (
                            <MenuItem key={area.id} value={area.id?.toString()}>
                                {area.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Sales Folk"
                        name="salesFolk"
                        size="small"
                        fullWidth
                        select
                        value={formData.salesFolk}
                        onChange={handleChange}
                    >
                        <MenuItem value="NoFilter">No Sales Folk filter</MenuItem>
                        {salesPeople.map((person) => (
                            <MenuItem key={person.id} value={person.id?.toString()}>
                                {person.name}
                            </MenuItem>
                        ))}
                    </TextField>


                    {/* Activity Greater Than */}
                    <TextField
                        label="Activity Greater Than"
                        name="actGreaterThan"
                        size="small"
                        fullWidth
                        value={formData.actGreaterThan}
                        onChange={handleChange}
                    />

                    {/* Activity Less Than */}
                    <TextField
                        label="Activity Less Than"
                        name="actLessThan"
                        size="small"
                        fullWidth
                        value={formData.actLessThan}
                        onChange={handleChange}
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
