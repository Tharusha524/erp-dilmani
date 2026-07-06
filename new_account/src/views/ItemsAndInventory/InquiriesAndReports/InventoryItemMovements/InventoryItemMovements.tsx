import React, { useState, useEffect, useMemo, useCallback } from "react";
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
    MenuItem,
    useMediaQuery,
    Theme,
    Button,
    Checkbox,
    FormControlLabel,
    ListSubheader,
    InputLabel,
    FormControl,
    Select,
    CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import DatePickerComponent from "../../../../components/DatePickerComponent";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { getInventoryLocations, InventoryLocation } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import {
    getInventoryItemMovements,
    InventoryItemMovementRow,
} from "../../../../api/Inventory/InventoryInquiryApi";
import ItemSearchSelect from "../../../../components/ItemSearchSelect";

interface ItemTransactionProps {
    itemId?: string | number;
}

const formatApiDate = (date: Date | null): string => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const transferViewUrl = (type: number, transNo: number): string => {
    const base =
        type === 16
            ? "/itemsandinventory/maintenance/items/transactions/view-transfer"
            : "/itemsandinventory/maintenance/items/transactions/view-adjustment";
    return `${base}?trans_no=${transNo}`;
};

export default function InventoryItemMovements({ itemId }: ItemTransactionProps) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [location, setLocation] = useState("");
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [selectedItem, setSelectedItem] = useState<string | number>(itemId ?? "");
    const [showInactive, setShowInactive] = useState(false);

    const [applied, setApplied] = useState<{
        stockId: string;
        location: string;
        fromDate: string;
        toDate: string;
    } | null>(null);

    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
    const navigate = useNavigate();

    const { data: locations = [] } = useQuery({
        queryKey: ["inventoryLocations"],
        queryFn: getInventoryLocations,
    });
    const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: getItems });
    const { data: categories = [] } = useQuery({
        queryKey: ["itemCategories"],
        queryFn: () => getItemCategories(),
    });

    useEffect(() => {
        if (itemId && !selectedItem) {
            setSelectedItem(itemId);
        }
    }, [itemId, selectedItem]);

    const { data: movementData, isLoading, isFetching } = useQuery({
        queryKey: ["inventoryItemMovements", applied],
        queryFn: () =>
            getInventoryItemMovements({
                stock_id: applied!.stockId,
                from_date: applied!.fromDate,
                to_date: applied!.toDate,
                ...(applied!.location ? { loc_code: applied!.location } : {}),
            }),
        enabled: Boolean(applied?.stockId && applied?.fromDate && applied?.toDate),
    });

    const rows: InventoryItemMovementRow[] = movementData?.rows ?? [];
    const qohBefore = movementData?.qoh_before ?? null;
    const qohAfter = movementData?.qoh_after ?? null;

    const totals = useMemo(() => {
        const sumIn = rows.reduce((acc, r) => acc + (Number(r.quantity_in) || 0), 0);
        const sumOut = rows.reduce((acc, r) => acc + (Number(r.quantity_out) || 0), 0);
        return { sumIn, sumOut };
    }, [rows]);

    const paginatedData = useMemo(() => {
        if (rowsPerPage === -1) return rows;
        return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [rows, page, rowsPerPage]);

    const handleSearch = useCallback(() => {
        const stockId = String(selectedItem || itemId || "").trim();
        if (!stockId || !fromDate || !toDate) return;
        setApplied({
            stockId,
            location,
            fromDate: formatApiDate(fromDate),
            toDate: formatApiDate(toDate),
        });
        setPage(0);
    }, [selectedItem, itemId, location, fromDate, toDate]);

    const selectionMade = Boolean(selectedItem || itemId);
    const datesSelected = Boolean(fromDate && toDate);
    const searched = Boolean(applied);

    const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Inventory Item Movements" },
    ];

    const renderTransLink = (row: InventoryItemMovementRow, label: string) => {
        if ((row.type === 16 || row.type === 17) && row.trans_no > 0) {
            return (
                <Button
                    variant="text"
                    color="primary"
                    onClick={() => navigate(transferViewUrl(row.type, row.trans_no))}
                    sx={{ textTransform: "none", padding: 0, minWidth: 0 }}
                >
                    {label}
                </Button>
            );
        }
        return <Typography variant="body2">{label}</Typography>;
    };

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
                    position: "relative",
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                <Box>
                    <PageTitle title="Inventory Item Movements" />
                    <Breadcrumb breadcrumbs={breadcrumbItems} />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Box sx={{ minWidth: 280 }}>
                        <ItemSearchSelect
                            label="Select Item"
                            selectedStockId={String(selectedItem ?? "")}
                            items={
                                items.filter(
                                    (item: { inactive?: number }) =>
                                        showInactive || item.inactive !== 1
                                ) as any[]
                            }
                            categories={categories.map((cat: { category_id: number; description: string }) => ({
                                id: cat.category_id,
                                category_name: cat.description,
                            }))}
                            includeInactive={showInactive}
                            onSelect={(item) => setSelectedItem(item?.stock_id ?? "")}
                        />
                    </Box>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                            />
                        }
                        label="Show Inactive"
                    />
                </Box>

                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
                    Back
                </Button>
            </Box>

            <Stack
                direction={isMobile ? "column" : "row"}
                spacing={2}
                sx={{ px: 2, mb: 2, alignItems: "center", flexWrap: "wrap" }}
            >
                <TextField
                    select
                    label="Location"
                    name="location"
                    size="small"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    SelectProps={{
                        displayEmpty: true,
                        renderValue: (selected: unknown) => {
                            if (!selected) return "All";
                            const found = locations.find(
                                (l: InventoryLocation) => String(l.loc_code) === String(selected)
                            );
                            return found ? found.location_name : String(selected);
                        },
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="">All</MenuItem>
                    {locations.map((loc: InventoryLocation) => (
                        <MenuItem key={loc.loc_code} value={String(loc.loc_code)}>
                            {loc.location_name}
                        </MenuItem>
                    ))}
                </TextField>
                <DatePickerComponent
                    label="From Date"
                    value={fromDate}
                    onChange={(date) => setFromDate(date)}
                />
                <DatePickerComponent
                    label="To Date"
                    value={toDate}
                    onChange={(date) => setToDate(date)}
                />
                <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleSearch}
                    disabled={!selectionMade || !datesSelected}
                    sx={{ backgroundColor: "var(--pallet-blue)" }}
                >
                    Search
                </Button>
            </Stack>

            <Stack sx={{ alignItems: "center" }}>
                <TableContainer
                    component={Paper}
                    elevation={2}
                    sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
                >
                    <Table aria-label="item movements table">
                        <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                            <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>#</TableCell>
                                <TableCell>Reference</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Detail</TableCell>
                                <TableCell align="right">Quantity In</TableCell>
                                <TableCell align="right">Quantity Out</TableCell>
                                <TableCell align="right">Quantity on Hand</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!selectionMade ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <Typography variant="body2">
                                            Please select an item to view movements.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : !datesSelected ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <Typography variant="body2">
                                            Please select both From Date and To Date, then click Search.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : !searched ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <Typography variant="body2">
                                            Click Search to load movements.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : isLoading || isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {qohBefore !== null && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    Quantity on hand before{" "}
                                                    {applied?.fromDate
                                                        ? new Date(applied.fromDate).toLocaleDateString()
                                                        : ""}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {qohBefore}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((row) => (
                                            <TableRow key={row.trans_id} hover>
                                                <TableCell>{row.type_name}</TableCell>
                                                <TableCell>
                                                    {renderTransLink(row, String(row.trans_no || ""))}
                                                </TableCell>
                                                <TableCell>
                                                    {renderTransLink(row, row.reference || "")}
                                                </TableCell>
                                                <TableCell>
                                                    {row.location_name || row.loc_code}
                                                </TableCell>
                                                <TableCell>{row.tran_date}</TableCell>
                                                <TableCell>{row.detail}</TableCell>
                                                <TableCell align="right">{row.quantity_in || ""}</TableCell>
                                                <TableCell align="right">{row.quantity_out || ""}</TableCell>
                                                <TableCell align="right">{row.quantity_on_hand}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
                                                <Typography variant="body2">No records found</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            )}
                        </TableBody>
                        <TableFooter>
                            {searched && qohAfter !== null && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={6} align="right">
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            Quantity on hand after{" "}
                                            {applied?.toDate
                                                ? new Date(applied.toDate).toLocaleDateString()
                                                : ""}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {totals.sumIn}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {totals.sumOut}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {qohAfter}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}

                            <TableRow>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                                    colSpan={9}
                                    count={rows.length}
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
