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
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { getInventoryLocations, InventoryLocation } from "../../../../api/InventoryLocation/InventoryLocationApi";

interface StockCheckSheetsFormData {
    itemCategory: string;
    location: string;
    showPictures: string;
    inventoryColumn: string;
    showShortages: string;
    suppressZero: string;
    itemLikes: string;
    comments: string;
    orientation: string;
    destination: string;
}

export default function StockCheckSheetsForm() {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    const [formData, setFormData] = useState<StockCheckSheetsFormData>({
        itemCategory: "NoFilter",
        location: "NoFilter",
        showPictures: "No",
        inventoryColumn: "No",
        showShortages: "No",
        suppressZero: "No",
        itemLikes: "",
        comments: "",
        orientation: "Portrait",
        destination: "Print",
    });

    const [errors, setErrors] = useState<Partial<StockCheckSheetsFormData>>({});
    const [itemCategories, setItemCategories] = useState<any[]>([]);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [itemCategoriesData, locationsData] = await Promise.all([
                    getItemCategories(),
                    getInventoryLocations(),
                ]);
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
        let newErrors: Partial<StockCheckSheetsFormData> = {};

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
                    Inventory Planning Report
                </Typography>

                <Stack spacing={2}>

                    {/* Item Category dropdown */}
                    <TextField
                        label="Item Category"
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
                        label="Inventory Column"
                        name="inventoryColumn"
                        size="small"
                        fullWidth
                        select
                        value={formData.inventoryColumn}
                        onChange={handleChange}
                    >
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                    </TextField>

                    <TextField
                        label="Show Only Shortages"
                        name="showShortages"
                        size="small"
                        fullWidth
                        select
                        value={formData.showShortages}
                        onChange={handleChange}
                    >
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                    </TextField>

                    <TextField
                        label="Suppress Zeros"
                        name="suppressZero"
                        size="small"
                        fullWidth
                        select
                        value={formData.suppressZero}
                        onChange={handleChange}
                    >
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                    </TextField>

                    <TextField
                        label="Item Likes"
                        name="itemLikes"
                        size="small"
                        fullWidth
                        value={formData.itemLikes}
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
