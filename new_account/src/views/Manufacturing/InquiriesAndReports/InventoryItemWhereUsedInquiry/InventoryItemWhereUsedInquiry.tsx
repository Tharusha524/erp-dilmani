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
    TableFooter,
    TablePagination,
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
import { getWhereUsed } from "../../../../api/Manufacturing/ManufacturingInquiryApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import ItemSearchSelect from "../../../../components/ItemSearchSelect";

function InventoryItemWhereUsedInquiry() {
    const [selectedItem, setSelectedItem] = useState("");
    const [itemCode, setItemCode] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

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

    useEffect(() => {
        if ((!selectedItem || String(selectedItem).trim() === "") && items.length > 0) {
            const first = items[0];
            const firstStockId = first?.stock_id ?? first?.id ?? "";
            setSelectedItem(String(firstStockId));
            setItemCode(String(firstStockId));
        }
    }, [items, selectedItem]);

    useEffect(() => {
        if (selectedItem && items.length > 0) {
            const selectedItemData = items.find((item: any) => String(item.stock_id ?? item.id) === String(selectedItem));
            if (selectedItemData) {
                setItemCode(String(selectedItemData.stock_id ?? selectedItemData.id ?? selectedItem));
            }
        }
    }, [selectedItem, items]);

    const { data: whereUsed = [], isFetching } = useQuery({
        queryKey: ["whereUsed", selectedItem],
        queryFn: () => getWhereUsed(selectedItem),
        enabled: Boolean(selectedItem),
    });

    const paginatedData = useMemo(() => {
        if (rowsPerPage === -1) return whereUsed;
        return whereUsed.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [whereUsed, page, rowsPerPage]);

    const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Inventory Item Where Used Inquiry" },
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
                    <PageTitle title="Inventory Item Where Used Inquiry" />
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
                            items={items as any[]}
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
                <Stack sx={{ alignItems: "center" }}>
                    <TableContainer
                        component={Paper}
                        elevation={2}
                        sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
                    >
                        <Table aria-label="inventory item where used inquiry table">
                            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                                <TableRow>
                                    <TableCell>Parent Item</TableCell>
                                    <TableCell>Work Centre</TableCell>
                                    <TableCell>Location</TableCell>
                                    <TableCell>Quantity Required</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {isFetching ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">Loading...</TableCell>
                                    </TableRow>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((item, index) => (
                                        <TableRow key={`${item.parent}-${index}`} hover>
                                            <TableCell>
                                                <Button
                                                    variant="text"
                                                    color="primary"
                                                    onClick={() => navigate("/manufacturing/maintenance/bills-of-material", { state: { stock_id: item.parent } })}
                                                >
                                                    {item.parent_label}
                                                </Button>
                                            </TableCell>
                                            <TableCell>{item.work_centre}</TableCell>
                                            <TableCell>{item.location}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography variant="body2">No Records Found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TablePagination
                                        rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                                        colSpan={4}
                                        count={whereUsed.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                        showFirstButton
                                        showLastButton
                                    />
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </TableContainer>
                </Stack>
            )}
        </FormPageLayout>
    );
}

export default InventoryItemWhereUsedInquiry;
