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
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { getCurrencies, Currency } from "../../../../api/Currency/currencyApi";

interface PrintWorkOrdersFormData {
    from: string;
    to: string;
    currencyFilter: string;
    email: string;
    comments: string;
    orientation: string;
}

export default function PrintWorkOrdersForm() {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    const [formData, setFormData] = useState<PrintWorkOrdersFormData>({
        from: "",
        to: "",
        email: "No",
        currencyFilter: "NoFilter",
        comments: "",
        orientation: "Portrait",
    });

    const [errors, setErrors] = useState<Partial<PrintWorkOrdersFormData>>({});
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const currenciesData = await getCurrencies();
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
        let newErrors: Partial<PrintWorkOrdersFormData> = {};

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
                    Print Work Orders
                </Typography>

                <Stack spacing={2}>

                    <TextField
                        label="From Work Order"
                        name="from"
                        size="small"
                        fullWidth
                        value={formData.from}
                        onChange={handleChange}
                    />

                    <TextField
                        label="To Work Order"
                        name="to"
                        size="small"
                        fullWidth
                        value={formData.to}
                        onChange={handleChange}
                    />

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

                    {/* Email Locations */}
                    <TextField
                        label="Email Locations"
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
