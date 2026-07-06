import React, { useState, useMemo } from "react";
import {
    Box,
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
    useMediaQuery,
    Theme,
    Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "../../../../../components/BreadCrumb";
import PageTitle from "../../../../../components/PageTitle";
import theme from "../../../../../theme";
import DatePickerComponent from "../../../../../components/DatePickerComponent";
import { Grid } from "@mui/material";
import { getPurchaseOrdersInquiry } from "../../../../../api/Purchases/PurchasesApi";

interface SupplierPurchaseOrderProps {
    supplierId?: string | number;
}

export default function SupplierPurchaseOrdersTable({ supplierId }: SupplierPurchaseOrderProps) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchFilters, setSearchFilters] = useState({
        order: "",
        ref: "",
        fromDate: null as Date | null,
        toDate: null as Date | null,
        location: "",
        item: "",
    });

    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
    const navigate = useNavigate();

    const { data: purchaseOrders = [], isLoading } = useQuery({
        queryKey: ["supplierPurchaseOrdersInquiry", supplierId],
        queryFn: () =>
            getPurchaseOrdersInquiry({
                supplier_id: supplierId ? Number(supplierId) : undefined,
                limit: 500,
            }),
        enabled: Boolean(supplierId),
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSearchFilters({ ...searchFilters, [name]: value });
    };

    const handleDateChange = (name: string, date: Date | null) => {
        setSearchFilters({ ...searchFilters, [name]: date });
    };

    const mappedOrders = useMemo(() => {
        return (purchaseOrders as any[]).map((po) => ({
            id: po.order_no,
            order: po.order_no,
            ref: po.reference ?? "",
            supplier: po.supplier_name ?? po.supplier_id,
            branch: po.into_stock_location ?? "",
            supplierRef: po.requisition_no ?? "",
            orderDate: po.ord_date ?? "",
            currency: "",
            orderTotal: po.total ?? 0,
        }));
    }, [purchaseOrders]);

    const filteredData = useMemo(() => {
        return mappedOrders.filter((so) => {
            const matchesOrder = searchFilters.order
                ? String(so.order).toLowerCase().includes(searchFilters.order.toLowerCase())
                : true;

            const matchesLocation = searchFilters.location
                ? String(so.branch).toLowerCase().includes(searchFilters.location.toLowerCase())
                : true;

            let matchesDate = true;
            if (searchFilters.fromDate) {
                matchesDate =
                    new Date(so.orderDate).getTime() >= searchFilters.fromDate.getTime();
            }
            if (matchesDate && searchFilters.toDate) {
                matchesDate =
                    new Date(so.orderDate).getTime() <= searchFilters.toDate.getTime();
            }

            return matchesOrder && matchesLocation && matchesDate;
        });
    }, [mappedOrders, searchFilters]);

    const paginatedData = useMemo(() => {
        if (rowsPerPage === -1) return filteredData;
        return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredData, page, rowsPerPage]);

    const handleChangePage = (_event: any, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Purchase Orders" },
    ];

    return (
        <Stack>
            <Box
                sx={{
                    padding: theme.spacing(2),
                    boxShadow: 2,
                    marginY: 2,
                    borderRadius: 1,
                    overflowX: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Box>
                    <PageTitle title="Purchase Orders" />
                    <Breadcrumb breadcrumbs={breadcrumbItems} />
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/purchase/maintenance/suppliers")}
                    >
                        Back
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={2} sx={{ px: 2, mb: 2 }}>
                <Grid item xs={12} sm={2}>
                    <TextField
                        fullWidth
                        label="#"
                        name="order"
                        size="small"
                        value={searchFilters.order}
                        onChange={handleFilterChange}
                    />
                </Grid>

                <Grid item xs={12} sm={3} sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>From Date:</Typography>
                    <DatePickerComponent
                        label=""
                        value={searchFilters.fromDate}
                        onChange={(date) => handleDateChange("fromDate", date)}
                    />
                </Grid>

                <Grid item xs={12} sm={3} sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>To Date:</Typography>
                    <DatePickerComponent
                        label=""
                        value={searchFilters.toDate}
                        onChange={(date) => handleDateChange("toDate", date)}
                    />
                </Grid>

                <Grid item xs={12} sm={2}>
                    <TextField
                        fullWidth
                        label="Location"
                        name="location"
                        size="small"
                        value={searchFilters.location}
                        onChange={handleFilterChange}
                    />
                </Grid>
            </Grid>

            <Stack sx={{ alignItems: "center" }}>
                <TableContainer component={Paper} elevation={2} sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}>
                    <Table aria-label="purchase orders table">
                        <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Ref</TableCell>
                                <TableCell>Supplier</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell>Supplier's Reference</TableCell>
                                <TableCell>Order Date</TableCell>
                                <TableCell>Order Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2">Loading...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((so) => (
                                    <TableRow key={so.id} hover>
                                        <TableCell>{so.order}</TableCell>
                                        <TableCell>{so.ref}</TableCell>
                                        <TableCell>{so.supplier}</TableCell>
                                        <TableCell>{so.branch}</TableCell>
                                        <TableCell>{so.supplierRef}</TableCell>
                                        <TableCell>{so.orderDate}</TableCell>
                                        <TableCell>{so.orderTotal}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2">No Records Found</Typography>
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
                                    showFirstButton
                                    showLastButton
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            </Stack>
        </Stack>
    );
}
