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
import { getItems } from "../../../../api/Item/ItemApi";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { getInventoryLocations, InventoryLocation } from "../../../../api/InventoryLocation/InventoryLocationApi";

interface WorkOrderListingFormData {
    item: string;
    comments: string;
    orientation: string;
    destination: string;
    inventoryLocation: string;
    outstandingOnly: string;
    showGLRows: string;
}

export default function WorkOrderListingForm() {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    const [formData, setFormData] = useState<WorkOrderListingFormData>({
        item: "NoFilter",
        comments: "",
        orientation: "Portrait",
        destination: "Print",
        inventoryLocation: "NoFilter",
        outstandingOnly: "No",
        showGLRows: "No",
    });

    const [errors, setErrors] = useState<Partial<WorkOrderListingFormData>>({});
    const [items, setItems] = useState<any[]>([]);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [itemsData, locationsData] = await Promise.all([
                    getItems(),
                    getInventoryLocations()
                ]);
                setItems(itemsData);
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
        let newErrors: Partial<WorkOrderListingFormData> = {};

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
                   Work Order Listing
                </Typography>

                <Stack spacing={2}>
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

                    {/* Inventory Location dropdown */}
                    <TextField
                        label="Inventory Location"
                        name="inventoryLocation"
                        size="small"
                        fullWidth
                        select
                        value={formData.inventoryLocation}
                        onChange={handleChange}
                    >
                        <MenuItem value="NoFilter">No Location Filter</MenuItem>
                        {locations.map((location) => (
                            <MenuItem key={location.loc_code} value={location.loc_code}>
                                {location.location_name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Outstanding Only dropdown */}
                    <TextField
                        label="Outstanding Only"
                        name="outstandingOnly"
                        size="small"
                        fullWidth
                        select
                        value={formData.outstandingOnly}
                        onChange={handleChange}
                    >
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                    </TextField>

                    {/* Show GL Rows dropdown */}
                    <TextField
                        label="Show GL Rows"
                        name="showGLRows"
                        size="small"
                        fullWidth
                        select
                        value={formData.showGLRows}
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
