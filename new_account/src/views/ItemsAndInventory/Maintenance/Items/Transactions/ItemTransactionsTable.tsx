import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../../components/BreadCrumb";
import PageTitle from "../../../../../components/PageTitle";
import theme from "../../../../../theme";
import DatePickerComponent from "../../../../../components/DatePickerComponent";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getStockMoves } from "../../../../../api/StockMoves/StockMovesApi";
import { getInventoryLocations, InventoryLocation } from "../../../../../api/InventoryLocation/InventoryLocationApi";

interface ItemTransactionProps {
  itemId?: string | number;
}

// We'll fetch transactions from stock_moves API via getStockMoves

export default function ItemTransactionsTable({ itemId }: ItemTransactionProps) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        location: "",
        fromDate: null as Date | null,
        toDate: null as Date | null,
    });
    const [locations, setLocations] = useState<InventoryLocation[]>([]);

    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
    const navigate = useNavigate();

    // Fetch data from stock_moves
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const stockMoves: any[] = await getStockMoves();
                // Fetch inventory locations map so we can display friendly names
                const invLocs: InventoryLocation[] = await getInventoryLocations();
                const invMap = new Map<string, string>();
                invLocs.forEach((l) => {
                    if (l.loc_code) invMap.set(String(l.loc_code), l.location_name);
                });

                // If itemId provided, filter by stock_id
                const filteredMoves = itemId
                    ? stockMoves.filter((m) => String(m.stock_id) === String(itemId))
                    : stockMoves;

                // Sort by tran_date ascending so running QOH makes sense
                filteredMoves.sort((a: any, b: any) => {
                    const da = new Date(a.tran_date || a.tranDate || a.date || 0).getTime();
                    const db = new Date(b.tran_date || b.tranDate || b.date || 0).getTime();
                    return da - db;
                });

                // Maintain running QOH per stock id (in case API returns moves for multiple items)
                const qohByStock = new Map<string, number>();
                const mapped = filteredMoves.map((m: any, idx: number) => {
                    const qty = Number(m.qty) || 0;
                    const quantityIn = qty > 0 ? qty : 0;
                    const quantityOut = qty < 0 ? Math.abs(qty) : 0;

                    // Determine a stock identifier for per-stock running totals
                    const stockIdRaw = m.stock_id ?? m.stock?.stock_id ?? m.stockmaster_id ?? m.stock_master_id ?? m.stockId ?? m.stock;
                    const stockKey = stockIdRaw !== undefined && stockIdRaw !== null ? String(stockIdRaw) : `__idx_${idx}`;

                    const prev = qohByStock.get(stockKey) || 0;
                    const newQoh = prev + qty;
                    qohByStock.set(stockKey, newQoh);

                    const locCode = m.loc_code ?? m.locCode ?? m.location_code ?? m.loc?.loc_code ?? "";
                    // Prefer inventory_locations lookup for friendly name
                    const locName = invMap.get(String(locCode)) ?? m.location_name ?? m.location ?? m.loc?.location_name ?? "";
                    const tranDate = m.tran_date ?? m.tranDate ?? m.date ?? "";

                    return {
                        id: m.id ?? m.stockmove_id ?? idx,
                        type: m.type ?? String(m.type) ?? "",
                        number: m.trans_no ?? m.id ?? "",
                        reference: m.reference ?? "",
                        loc_code: locCode,
                        location_name: locName,
                        date: tranDate,
                        detail: m.detail ?? m.memo ?? m.description ?? "",
                        quantityIn,
                        quantityOut,
                        quantityOnHand: newQoh,
                        _raw: m,
                    };
                });

                // Keep oldest-first ordering (mapped is sorted ascending by date)
                setTransactions(mapped);
            } catch (err) {
                console.error("Failed to fetch stock moves:", err);
                setTransactions([]);
            }
        };

        fetchTransactions();
    }, [itemId]);

    // Fetch inventory locations (to display friendly names in dropdown)
    useEffect(() => {
        const fetchInventoryLocations = async () => {
            try {
                const invLocs = await getInventoryLocations();
                // invLocs expected to be array of InventoryLocation
                setLocations(invLocs || []);
            } catch (err) {
                console.error("Failed to fetch inventory locations:", err);
                setLocations([]);
            }
        };

        fetchInventoryLocations();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    const handleDateChange = (name: string, date: Date | null) => {
        setFilters({ ...filters, [name]: date });
    };

    // Filtered data
    const filteredData = useMemo(() => {
            return transactions.filter((txn) => {
            // Location filter: exact match on loc_code (or show all when empty)
            const matchesLocation = !filters.location || String(txn.loc_code ?? txn._raw?.loc_code ?? txn.location) === String(filters.location);

            const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

            const txnDateRaw = txn.date ?? txn._raw?.tran_date ?? txn._raw?.tranDate ?? txn._raw?.date;
            const txnDate = txnDateRaw ? new Date(txnDateRaw) : null;

            const matchesFromDate = !filters.fromDate || (txnDate && normalize(txnDate) >= normalize(filters.fromDate));

            const matchesToDate = !filters.toDate || (txnDate && normalize(txnDate) <= normalize(filters.toDate));

            return matchesLocation && matchesFromDate && matchesToDate;
        });
    }, [transactions, filters]);

    const paginatedData = useMemo(() => {
        if (rowsPerPage === -1) return filteredData;
        return filteredData.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        );
    }, [filteredData, page, rowsPerPage]);

    // Quantity on hand before From Date (based on all transactions, respects location filter)
    const qohBeforeDate = useMemo(() => {
        if (!filters.fromDate) return null;
        const cutoff = new Date(filters.fromDate);
        cutoff.setHours(0, 0, 0, 0);

        return transactions
            .filter((t) => {
                // respect location filter when computing QOH
                const matchesLocation = !filters.location || String(t.loc_code ?? t._raw?.loc_code ?? t.location) === String(filters.location);
                const txnDateRaw = t.date ?? t._raw?.tran_date ?? t._raw?.tranDate ?? t._raw?.date;
                const txnDate = txnDateRaw ? new Date(txnDateRaw) : null;
                return matchesLocation && txnDate && txnDate < cutoff;
            })
            .reduce((acc, t) => acc + (Number(t._raw?.qty) || 0), 0);
    }, [transactions, filters.fromDate, filters.location]);

    // Quantity on hand after To Date (inclusive) -- useful for the "after" row
    const qohAfterDate = useMemo(() => {
        if (!filters.toDate) return null;
        const cutoff = new Date(filters.toDate);
        cutoff.setHours(23, 59, 59, 999);

        return transactions
            .filter((t) => {
                const matchesLocation = !filters.location || String(t.loc_code ?? t._raw?.loc_code ?? t.location) === String(filters.location);
                const txnDateRaw = t.date ?? t._raw?.tran_date ?? t._raw?.tranDate ?? t._raw?.date;
                const txnDate = txnDateRaw ? new Date(txnDateRaw) : null;
                return matchesLocation && txnDate && txnDate <= cutoff;
            })
            .reduce((acc, t) => acc + (Number(t._raw?.qty) || 0), 0);
    }, [transactions, filters.toDate, filters.location]);

    // Totals for the currently filtered data (between from/to and location)
    const totals = useMemo(() => {
        const sumIn = filteredData.reduce((acc, t) => acc + (Number(t.quantityIn) || 0), 0);
        const sumOut = filteredData.reduce((acc, t) => acc + (Number(t.quantityOut) || 0), 0);
        // final QOH for filteredData: prefer the latest transaction's quantityOnHand if available
    // final QOH should be taken from the latest transaction in the filtered set (last element)
    const finalQoh = filteredData.length > 0 ? Number(filteredData[filteredData.length - 1].quantityOnHand) : (qohBeforeDate ?? 0);
        return { sumIn, sumOut, finalQoh };
    }, [filteredData, qohBeforeDate]);

    // Only show table data when both From and To dates are selected
    const datesSelected = Boolean(filters.fromDate && filters.toDate);

    // Reset to first page when dates selection becomes active
    useEffect(() => {
        if (datesSelected) setPage(0);
    }, [datesSelected]);

    const handleChangePage = (_event: any, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Item Transactions" },
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
                    <PageTitle title="Item Transactions" />
                    <Breadcrumb breadcrumbs={breadcrumbItems} />
                </Box>

            </Box>

            {/* Search & Filter */}
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
                    value={filters.location}
                    onChange={handleFilterChange}
                    SelectProps={{
                        displayEmpty: true,
                        renderValue: (selected: any) => {
                            // Only treat explicit empty/null/undefined as "All"
                            if (selected === "" || selected === null || selected === undefined) return "All";
                            const found = locations.find((l) => String(l.loc_code) === String(selected));
                            return found ? found.location_name : String(selected);
                        },
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="">All</MenuItem>
                    {locations.map((loc) => (
                        <MenuItem key={loc.loc_code} value={String(loc.loc_code)}>
                            {loc.location_name}
                        </MenuItem>
                    ))}
                </TextField>
                <DatePickerComponent
                    label="From Date"
                    value={filters.fromDate}
                    onChange={(date) => handleDateChange("fromDate", date)}
                />
                <DatePickerComponent
                    label="To Date"
                    value={filters.toDate}
                    onChange={(date) => handleDateChange("toDate", date)}
                />
            </Stack>

            <Stack sx={{ alignItems: "center" }}>
                <TableContainer
                    component={Paper}
                    elevation={2}
                    sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
                >
                    <Table aria-label="item transactions table">
                        <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                            <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>#</TableCell>
                                <TableCell>Reference</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Detail</TableCell>
                                <TableCell>Quantity In</TableCell>
                                <TableCell>Quantity Out</TableCell>
                                <TableCell>Quantity on Hand</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!datesSelected ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <Typography variant="body2">Please select both From Date and To Date to view transactions.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {/* Quantity on hand BEFORE From Date (if From Date selected) */}
                                    {qohBeforeDate !== null && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    Quantity on hand before {filters.fromDate ? new Date(filters.fromDate).toLocaleDateString() : ""}
                                                </Typography>
                                            </TableCell>
                                            <TableCell />
                                            <TableCell />
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {qohBeforeDate}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((txn) => (
                                            <TableRow key={txn.id} hover>
                                                <TableCell>{txn.type}</TableCell>
                                                <TableCell>
                                                    {txn.reference && (String(Number(txn.type)) === "16" || String(Number(txn.type)) === "17") ? (
                                                        <Button
                                                            variant="text"
                                                            color="primary"
                                                            onClick={() => {
                                                                const t = String(Number(txn.type));
                                                                const ref = encodeURIComponent(String(txn.reference));
                                                                const url =
                                                                    t === "16"
                                                                        ? `/itemsandinventory/maintenance/items/transactions/view-transfer?ref=${ref}`
                                                                        : `/itemsandinventory/maintenance/items/transactions/view-adjustment?ref=${ref}`;
                                                                navigate(url);
                                                            }}
                                                            sx={{ textTransform: "none", padding: 0, minWidth: 0 }}
                                                        >
                                                            {String(txn.reference).split("/")[0]}
                                                        </Button>
                                                    ) : (
                                                        <Typography variant="body2">{txn.number}</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {txn.reference && (String(Number(txn.type)) === "16" || String(Number(txn.type)) === "17") ? (
                                                        <Button
                                                            variant="text"
                                                            color="primary"
                                                            onClick={() => {
                                                                const t = String(Number(txn.type));
                                                                const ref = encodeURIComponent(String(txn.reference));
                                                                const url =
                                                                    t === "16"
                                                                        ? `/itemsandinventory/maintenance/items/transactions/view-transfer?ref=${ref}`
                                                                        : `/itemsandinventory/maintenance/items/transactions/view-adjustment?ref=${ref}`;
                                                                navigate(url);
                                                            }}
                                                            sx={{ textTransform: "none", padding: 0, minWidth: 0 }}
                                                        >
                                                            {String(txn.reference)}
                                                        </Button>
                                                    ) : (
                                                        <Typography variant="body2">{txn.number}</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>{txn.location_name ?? txn.loc_code ?? txn.location}</TableCell>
                                                <TableCell>{txn.date}</TableCell>
                                                <TableCell>{txn.detail}</TableCell>
                                                <TableCell>{txn.quantityIn}</TableCell>
                                                <TableCell>{txn.quantityOut}</TableCell>
                                                <TableCell>{txn.quantityOnHand}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
                                                <Typography variant="body2">No Records Found</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            )}
                        </TableBody>
                        <TableFooter>

                            {/* Quantity on hand AFTER To Date (if To Date selected). Shows sums in In/Out and final QOH */}
                            {qohAfterDate !== null && (
                                <TableRow>
                                    <TableCell colSpan={6} align="right">
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            Quantity on hand after {filters.toDate ? new Date(filters.toDate).toLocaleDateString() : ""}
                                        </Typography>
                                    </TableCell>
                                    {/* For after row we show the sums (over filteredData) in Quantity In / Out */}
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {totals.sumIn}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {totals.sumOut}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {qohAfterDate}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}

                            <TableRow>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                                    colSpan={9}
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
