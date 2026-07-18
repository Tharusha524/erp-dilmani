import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useState, useMemo } from "react";
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
    TextField,
    MenuItem,
    useMediaQuery,
    Theme,
    FormControl,
    InputLabel,
    Select,
    ListSubheader,
    CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import theme from "../../../../theme";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import { getItems } from "../../../../api/Item/ItemApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { getInventoryItemStatus } from "../../../../api/Inventory/InventoryInquiryApi";
import ItemSearchSelect from "../../../../components/ItemSearchSelect";

interface ItemStatusProps {
    itemId?: string | number;
}

function InventoryItemStatus({ itemId }: ItemStatusProps) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItemId, setSelectedItemId] = useState<string | number | null>(itemId ?? null);
    const navigate = useNavigate();
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

    const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: getItems });
    const { data: categories = [] } = useQuery({
        queryKey: ["itemCategories"],
        queryFn: () => getItemCategories(),
    });

    const stockId = selectedItemId ? String(selectedItemId) : "";

    const { data: statusRows = [], isLoading, isFetching } = useQuery({
        queryKey: ["inventoryItemStatus", stockId],
        queryFn: () => getInventoryItemStatus(stockId),
        enabled: Boolean(stockId),
    });

    const filteredData = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return statusRows;
        return statusRows.filter(
            (row) =>
                row.location.toLowerCase().includes(q) ||
                row.loc_code.toLowerCase().includes(q)
        );
    }, [statusRows, searchQuery]);

    const paginatedData = useMemo(() => {
        if (rowsPerPage === -1) return filteredData;
        return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredData, page, rowsPerPage]);

    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Inventory Item Status" },
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
                    <PageTitle title="Inventory Item Status" />
                    <Breadcrumb breadcrumbs={breadcrumbItems} />
                </Box>

                <Box sx={{ minWidth: 280 }}>
                    <ItemSearchSelect
                        label="Select Item"
                        selectedStockId={String(selectedItemId ?? "")}
                        items={items as any[]}
                        categories={categories.map((cat: { category_id: number; description: string }) => ({
                            id: cat.category_id,
                            category_name: cat.description,
                        }))}
                        onSelect={(item) => {
                            setSelectedItemId(item?.stock_id ?? null);
                            setPage(0);
                        }}
                    />
                </Box>

                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/itemsandinventory/inquiriesandreports")}
                >
                    Back
                </Button>
            </Box>
            {selectedItemId && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", px: 2 }}>
                    <TextField
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by location..."
                        size="small"
                    />
                </Box>
            )}
            <Stack sx={{ alignItems: "center" }}>
                <TableContainer
                    component={Paper}
                    elevation={2}
                    sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
                >
                    <Table aria-label="inventory item status table">
                        <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                            <TableRow>
                                <TableCell>No</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell align="right">Quantity on Hand</TableCell>
                                <TableCell align="right">Reorder Level</TableCell>
                                <TableCell align="right">Demand</TableCell>
                                <TableCell align="right">Available</TableCell>
                                <TableCell align="right">On Order</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {!selectedItemId ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2">
                                            Please select an item to view status.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : isLoading || isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((row, index) => (
                                    <TableRow key={row.loc_code} hover>
                                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                        <TableCell>{row.location}</TableCell>
                                        <TableCell align="right">{row.quantity_on_hand}</TableCell>
                                        <TableCell align="right">{row.reorder_level}</TableCell>
                                        <TableCell align="right">{row.demand}</TableCell>
                                        <TableCell align="right">{row.available}</TableCell>
                                        <TableCell align="right">{row.on_order}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2">No records found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>

                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                                    colSpan={7}
                                    count={filteredData.length}
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
        </FormPageLayout>
    );
}

export default InventoryItemStatus;
