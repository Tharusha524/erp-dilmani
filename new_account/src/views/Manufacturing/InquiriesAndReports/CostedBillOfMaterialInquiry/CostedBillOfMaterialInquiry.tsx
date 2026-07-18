import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useMemo, useState, useEffect } from "react";
import {
    Box,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    useMediaQuery,
    Theme,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ListSubheader,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import { useQuery } from "@tanstack/react-query";
import { getItems } from "../../../../api/Item/ItemApi";
import { getCostedBom } from "../../../../api/Manufacturing/ManufacturingInquiryApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import ItemSearchSelect from "../../../../components/ItemSearchSelect";

function CostedBillOfMaterialInquiry() {
    const [selectedItem, setSelectedItem] = useState("");
    const [itemCode, setItemCode] = useState("");

    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
    const navigate = useNavigate();

    const { data: rawItems } = useQuery({
        queryKey: ["items"],
        queryFn: getItems,
    });

    const { data: categories = [] } = useQuery<{ category_id: number; description: string }[]>({
        queryKey: ["itemCategories"],
        queryFn: () => getItemCategories() as Promise<{ category_id: number; description: string }[]>,
    });

    const items = rawItems?.data ?? rawItems ?? [];

    const filteredItems = useMemo(() => (items || []).filter((it: any) => {
        const flag = it.mb_flag ?? it.mbFlag ?? it.mb ?? 0;
        return Number(flag) === 1;
    }), [items]);

    useEffect(() => {
        if ((!selectedItem || String(selectedItem).trim() === "") && filteredItems.length > 0) {
            const first = filteredItems[0];
            const firstStockId = first?.stock_id ?? first?.id ?? "";
            setSelectedItem(String(firstStockId));
            setItemCode(String(firstStockId));
        }
    }, [filteredItems, selectedItem]);

    useEffect(() => {
        if (selectedItem && filteredItems.length > 0) {
            const selectedItemData = filteredItems.find((item: any) => String(item.stock_id ?? item.id) === String(selectedItem));
            if (selectedItemData) {
                setItemCode(String(selectedItemData.stock_id ?? selectedItemData.id ?? selectedItem));
            }
        }
    }, [selectedItem, filteredItems]);

    const { data: costedBom, isFetching } = useQuery({
        queryKey: ["costedBom", selectedItem],
        queryFn: () => getCostedBom(selectedItem),
        enabled: Boolean(selectedItem),
    });

    const bomLines = costedBom?.lines ?? [];
    const standardLabourCost = costedBom?.labour_cost ?? 0;
    const standardOverheadCost = costedBom?.overhead_cost ?? 0;
    const totalCost = costedBom?.total_cost ?? 0;
    const currency = costedBom?.currency ?? "";

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Costed Bill Of Material Inquiry" },
    ];

    return (
        <FormPageLayout>
            <Box
                sx={{
                    padding: theme.spacing(2),
                    boxShadow: 2,
                    marginY: 2,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                <Box>
                    <PageTitle title="Costed Bill Of Material Inquiry" />
                    <Breadcrumb breadcrumbs={breadcrumbItems} />
                </Box>

                <Box sx={{ px: 2, mb: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                    <TextField
                        label="Item Code"
                        value={itemCode}
                        InputProps={{ readOnly: true }}
                        size="medium"
                        sx={{ minWidth: 120 }}
                    />
                    <Box sx={{ minWidth: 280, flex: 1 }}>
                        <ItemSearchSelect
                            label="Select Item"
                            selectedStockId={selectedItem}
                            items={filteredItems as any[]}
                            categories={categories.map((cat) => ({
                                id: cat.category_id,
                                category_name: cat.description,
                            }))}
                            onSelect={(item) => {
                                const stockId = item?.stock_id ?? "";
                                setSelectedItem(String(stockId));
                                setItemCode(String(stockId));
                            }}
                        />
                    </Box>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/manufacturing/inquiriesandreports/")}>
                        Back
                    </Button>
                </Stack>
            </Box>
            {selectedItem && (
                <Stack sx={{ alignItems: "center" }} spacing={1}>
                    {currency && (
                        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "flex-start", px: 1 }}>
                            All amounts in {currency}
                        </Typography>
                    )}
                    <TableContainer
                        component={Paper}
                        elevation={2}
                        sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
                    >
                        <Table aria-label="costed bill of material inquiry table">
                            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                                <TableRow>
                                    <TableCell>Component</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Work Centre</TableCell>
                                    <TableCell>From Location</TableCell>
                                    <TableCell>Quantity</TableCell>
                                    <TableCell>Unit Cost</TableCell>
                                    <TableCell>Cost</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {isFetching ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">Loading...</TableCell>
                                    </TableRow>
                                ) : bomLines.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <Typography variant="body2">No bill of material defined for this item.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bomLines.map((line, index) => (
                                        <TableRow key={String(line.component) + "-" + index} hover>
                                            <TableCell>{line.component}</TableCell>
                                            <TableCell>{line.description}</TableCell>
                                            <TableCell>{line.work_centre}</TableCell>
                                            <TableCell>{line.location}</TableCell>
                                            <TableCell>{line.quantity}</TableCell>
                                            <TableCell>{Number(line.unit_cost).toFixed(2)}</TableCell>
                                            <TableCell>{Number(line.cost).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                    <TableCell colSpan={6}>Standard Labour Cost</TableCell>
                                    <TableCell>{Number(standardLabourCost).toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                    <TableCell colSpan={6}>Standard Overhead Cost</TableCell>
                                    <TableCell>{Number(standardOverheadCost).toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                                    <TableCell colSpan={6} sx={{ fontWeight: "bold" }}>Total Cost</TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }}>{Number(totalCost).toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            )}
        </FormPageLayout>
    );
}

export default CostedBillOfMaterialInquiry;
