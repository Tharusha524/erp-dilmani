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
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { getCurrencies, Currency } from "../../../../api/Currency/currencyApi";

interface Customer {
    debtor_no: number;
    name: string;
    // Add other fields as needed
}

interface PrintDeliveriesFormData {
    from: string;
    to: string;
    email: string;
    printPackingslips: string;
    comments: string;
    orientation: string;
}

export default function PrintDeliveriesForm() {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    const [formData, setFormData] = useState<PrintDeliveriesFormData>({
        from: "",
        to: "",
        email: "No",
        printPackingslips: "No",
        comments: "",
        orientation: "Portrait",
    });

    const [errors, setErrors] = useState<Partial<PrintDeliveriesFormData>>({});
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersData, currenciesData] = await Promise.all([
                    getCustomers(),
                    getCurrencies(),
                ]);
                setCustomers(customersData);
                setCurrencies(currenciesData);
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
        let newErrors: Partial<PrintDeliveriesFormData> = {};

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

                    <TextField
                        label="From"
                        name="from"
                        size="small"
                        fullWidth
                        select
                        value={formData.from}
                        onChange={handleChange}
                    >
                        <MenuItem value=""></MenuItem>
                        <MenuItem value=""></MenuItem>
                    </TextField>

                    <TextField
                        label="To"
                        name="to"
                        size="small"
                        fullWidth
                        select
                        value={formData.to}
                        onChange={handleChange}
                    >
                        <MenuItem value=""></MenuItem>
                        <MenuItem value=""></MenuItem>
                    </TextField>

                    {/* Email Customers */}
                    <TextField
                        label="Email Customers"
                        name="email"
                        size="small"
                        fullWidth
                        select
                        value={formData.email}
                        onChange={handleChange}
                    >
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                    </TextField>

                      <TextField
                        label="Print as Packing Slip:"
                        name="printPackingslips"
                        size="small"
                        fullWidth
                        select
                        value={formData.printPackingslips}
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
