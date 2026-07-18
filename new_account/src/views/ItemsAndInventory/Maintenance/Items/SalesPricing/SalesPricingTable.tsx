import { FormPageLayout } from "../../../../../components/Layout/FormPageLayout";
import React, { useState, useMemo, useEffect } from "react";
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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import theme from "../../../../../theme";
import Breadcrumb from "../../../../../components/BreadCrumb";
import PageTitle from "../../../../../components/PageTitle";
import SearchBar from "../../../../../components/SearchBar";
import { getSalesPricing, deleteSalesPricing } from "../../../../../api/SalesPricing/SalesPricingApi";
import DeleteConfirmationModal from "../../../../../components/DeleteConfirmationModal";
import ErrorModal from "../../../../../components/ErrorModal";
import ItemUsdSalesPricingPanel from "../../../../../components/ItemUsdSalesPricingPanel";

interface ItemSalesPricingProps {
    itemId?: string | number;
}

interface SalesPricing {
    id: number;
    currency: string;
    salesType: string;
    price: number;
    stock_id: string | number;
}

function SalesPricingTable({ itemId }: ItemSalesPricingProps) {
    const [salesData, setSalesData] = useState<SalesPricing[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [selectedId, setSelectedId] = useState<number | string | null>(null);
    const [errorOpen, setErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [pricingRefreshKey, setPricingRefreshKey] = useState(0);

    const loadPricing = async () => {
        try {
            const data = await getSalesPricing();
            const mappedData = data.map((item: any) => ({
                id: item.id,
                currency: item.currency_abbreviation || item.currency?.currency_abbreviation,
                salesType: item.sales_type_name || item.sales_type?.typeName,
                price: item.price,
                stock_id: item.stock_id,
            }));
            const filteredData = mappedData.filter((item) => item.stock_id == itemId);
            setSalesData(filteredData);
            setPage(0);
        } catch (error) {
            setErrorMessage("Failed to fetch sales pricing. Please try again.");
            setErrorOpen(true);
            console.error("Failed to fetch sales pricing:", error);
        }
    };

    useEffect(() => {
        if (itemId) {
            loadPricing();
        }
    }, [itemId, pricingRefreshKey]);

    const filteredData = useMemo(() => {
        return salesData.filter((item) =>
            item.salesType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.price.toString().includes(searchQuery)
        );
    }, [salesData, searchQuery]);

    const paginatedData = useMemo(() => {
        if (rowsPerPage === -1) return filteredData;
        return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredData, page, rowsPerPage]);

    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDeleteClick = (id: number) => {
        setSelectedId(id);
        setOpenDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedId) return;
        try {
            await deleteSalesPricing(selectedId);
            setSalesData((prev) => prev.filter((item) => item.id !== selectedId));
            setOpenDeleteModal(false);
            setSelectedId(null);
        } catch (error) {
            console.error("Failed to delete sales pricing:", error);
            setErrorMessage("Failed to delete. Please try again.");
            setErrorOpen(true);
            setOpenDeleteModal(false);
            setSelectedId(null);
        }
    };

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Sales Pricing" },
    ];

    return (
        <FormPageLayout>
            {/* Header */}
            <Box sx={{ padding: theme.spacing(2), boxShadow: 2, marginY: 2, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                    <PageTitle title="Sales Pricing" />
                    <Breadcrumb breadcrumbs={breadcrumbItems} />
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button variant="contained" color="primary" onClick={() => navigate(`/itemsandinventory/maintenance/items/add-sales-pricing/${itemId}`)}>
                        Add Sales Pricing
                    </Button>
                </Stack>
            </Box>
            {itemId ? (
                <Box sx={{ px: 2 }}>
                    <ItemUsdSalesPricingPanel
                        stockId={String(itemId)}
                        onSaved={() => setPricingRefreshKey((k) => k + 1)}
                    />
                </Box>
            ) : null}
            {/* Search */}
            <Stack direction="row" sx={{ px: 2, mb: 2, width: "100%", justifyContent: "flex-end" }}>
                <Box sx={{ width: isMobile ? "100%" : "300px" }}>
                    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} placeholder="Search Sales Type or Price..." />
                </Box>
            </Stack>
            {/* Table */}
            <Stack sx={{ alignItems: "center" }}>
                <TableContainer component={Paper} elevation={2} sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}>
                    <Table aria-label="sales pricing table">
                        <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                            <TableRow>
                                <TableCell>No</TableCell>
                                <TableCell>Currency</TableCell>
                                <TableCell>Sales Type</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((item, index) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                        <TableCell>{item.currency}</TableCell>
                                        <TableCell>{item.salesType}</TableCell>
                                        <TableCell>{item.price}</TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={() => navigate(`/itemsandinventory/maintenance/items/update-sales-pricing/${item.id}`)}>
                                                    Edit
                                                </Button>
                                                <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteClick(item.id)}>
                                                    Delete
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Typography variant="body2">No Records Found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>

                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                                    colSpan={5}
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
            <DeleteConfirmationModal
                open={openDeleteModal}
                title="Delete Sales Pricing"
                content="Are you sure you want to delete this sales pricing entry? This action cannot be undone."
                handleClose={() => setOpenDeleteModal(false)}
                handleReject={() => setOpenDeleteModal(false)}
                deleteFunc={handleDeleteConfirm}
                onSuccess={() => { }}
            />
            <ErrorModal
                open={errorOpen}
                onClose={() => setErrorOpen(false)}
                message={errorMessage}
            />
        </FormPageLayout>
    );
}

export default SalesPricingTable;
