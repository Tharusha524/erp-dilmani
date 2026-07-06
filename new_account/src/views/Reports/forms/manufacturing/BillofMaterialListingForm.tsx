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
import { getItems } from "../../../../api/Item/ItemApi";

interface BillofMaterialListingFormData {
    fromProduct: string;
    toProduct: string;
    comments: string;
    orientation: string;
    destination: string;
}

export default function BillofMaterialListingForm() {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    const [formData, setFormData] = useState<BillofMaterialListingFormData>({
        fromProduct: "NoFilter",
        toProduct: "NoFilter",
        comments: "",
        orientation: "Portrait",
        destination: "Print",
    });

    const [errors, setErrors] = useState<Partial<BillofMaterialListingFormData>>({});
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const itemsData = await getItems();
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
        let newErrors: Partial<BillofMaterialListingFormData> = {};

        // No validation needed for this form

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
                    Bill of Material Listing
                </Typography>

                <Stack spacing={2}>
                    {/* From Product dropdown */}
                    <TextField
                        label="From Product"
                        name="fromProduct"
                        size="small"
                        fullWidth
                        select
                        value={formData.fromProduct}
                        onChange={handleChange}
                    >
                        {items.map((item) => (
                            <MenuItem key={item.stock_id} value={item.stock_id}>
                                {item.description}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* From Product Code display */}
                    <TextField
                        label="From Product Code"
                        size="small"
                        fullWidth
                        value={formData.fromProduct !== "NoFilter" ? formData.fromProduct : ""}
                        InputProps={{ readOnly: true }}
                    />

                    {/* To Product dropdown */}
                    <TextField
                        label="To Product"
                        name="toProduct"
                        size="small"
                        fullWidth
                        select
                        value={formData.toProduct}
                        onChange={handleChange}
                    >
                        {items.map((item) => (
                            <MenuItem key={item.stock_id} value={item.stock_id}>
                                {item.description}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* To Product Code display */}
                    <TextField
                        label="To Product Code"
                        size="small"
                        fullWidth
                        value={formData.toProduct !== "NoFilter" ? formData.toProduct : ""}
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
        </Stack>
    );
}
