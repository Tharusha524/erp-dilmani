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
    Checkbox,
    FormControlLabel,
    ListSubheader,
    InputLabel,
    FormControl,
    Select,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import ItemSearchSelect from "../../../../components/ItemSearchSelect";
import theme from "../../../../theme";
import DatePickerComponent from "../../../../components/DatePickerComponent";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getLocations } from "../../../../api/FixedAssetsLocation/FixedAssetsLocationApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { searchFixedAssetMovements } from "../../../../api/FixedAssetsInquiry/FixedAssetsInquiryApi";
import { getFriendlyApiErrorMessage } from "../../../../utils/apiErrorMessage";

interface ItemTransactionProps {
    itemId?: string | number;
}

// We'll fetch transactions from stock_moves API via getStockMoves

export default function FixedAssetsMovements({ itemId }: ItemTransactionProps) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        location: "",
        fromDate: null as Date | null,
        toDate: null as Date | null,
    });
    const [locations, setLocations] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedItem, setSelectedItem] = useState<string | number>("");
    const [showInactive, setShowInactive] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [locNameMap, setLocNameMap] = useState<Map<string, string>>(new Map());

    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
    const navigate = useNavigate();

    const loadMovements = async () => {
        const idToMatch = selectedItem || itemId;
        if (!idToMatch) {
            alert("Please select a fixed asset");
            return;
        }
        setLoading(true);
        try {
            const data = await searchFixedAssetMovements({
                stockId: String(idToMatch),
                location: filters.location || undefined,
                fromDate: filters.fromDate
                    ? filters.fromDate.toISOString().split("T")[0]
                    : undefined,
                toDate: filters.toDate ? filters.toDate.toISOString().split("T")[0] : undefined,
            });
            const mapped = (data || []).map((m: any) => ({
                id: m.id,
                type: m.type ?? "",
                number: m.number ?? "",
                reference: m.reference ?? "",
                loc_code: m.loc_code ?? "",
                location_name: locNameMap.get(String(m.loc_code)) ?? m.loc_code ?? "",
                date: m.date ?? "",
                detail: m.detail ?? "",
                quantityIn: m.quantityIn ?? 0,
                quantityOut: m.quantityOut ?? 0,
                quantityOnHand: m.quantityOnHand ?? 0,
                _raw: m,
            }));
            setTransactions(mapped);
            setPage(0);
        } catch (err) {
            console.error("Failed to fetch FA movements:", err);
            setTransactions([]);
            alert(getFriendlyApiErrorMessage(err) || "Failed to load fixed asset movements");
        } finally {
            setLoading(false);
        }
    };

    // Fetch fixed assets locations (to display friendly names in dropdown)
    useEffect(() => {
        const fetchFixedAssetsLocations = async () => {
            try {
                const faLocs = await getLocations();
                setLocations(faLocs || []);
                const faMap = new Map<string, string>();
                (faLocs || []).forEach((l: any) => {
                    if (l.locationCode) faMap.set(String(l.locationCode), l.locationName);
                });
                setLocNameMap(faMap);
            } catch (err) {
                console.error("Failed to fetch fixed assets locations:", err);
                setLocations([]);
            }
        };

        fetchFixedAssetsLocations();
    }, []);

    // Fetch items (stock_master) and categories for the item dropdown
    useEffect(() => {
        const fetchItemsAndCategories = async () => {
            try {
                const [fetchedItems, fetchedCategories] = await Promise.all([getItems(), getItemCategories()]);
                const faOnly = (fetchedItems || []).filter(
                    (i: any) => Number(i.mb_flag) === 4 && (showInactive || !i.inactive)
                );
                setItems(faOnly);
                setCategories(fetchedCategories || []);
            } catch (err) {
                console.error("Failed to fetch items/categories:", err);
                setItems([]);
                setCategories([]);
            }
        };

        fetchItemsAndCategories();
    }, [showInactive]);

    useEffect(() => {
        if (itemId) setSelectedItem(itemId);
    }, [itemId]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    const handleDateChange = (name: string, date: Date | null) => {
        setFilters({ ...filters, [name]: date });
    };

    const filteredData = useMemo(() => transactions, [transactions]);

    const paginatedData = useMemo(() => {
        if (rowsPerPage === -1) return filteredData;
        return filteredData.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        );
    }, [filteredData, page, rowsPerPage]);

    // Quantity on hand before From Date (based on all transactions, respects location filter)
    const qohBeforeDate = useMemo(() => {
        const idToMatch = selectedItem || itemId;
        if (!filters.fromDate) return null;
        const cutoff = new Date(filters.fromDate);
        cutoff.setHours(0, 0, 0, 0);
        return transactions
            .filter((t) => {
                // respect location filter when computing QOH
                const matchesLocation = !filters.location || String(t.loc_code ?? t._raw?.loc_code ?? t.location) === String(filters.location);
                // respect item selection
                const rawStockId = t._raw?.stock_id ?? t._raw?.stock?.stock_id ?? t._raw?.stockmaster_id ?? t._raw?.stock_master_id;
                const matchesItem = !idToMatch || String(rawStockId) === String(idToMatch);
                const txnDateRaw = t.date ?? t._raw?.tran_date ?? t._raw?.tranDate ?? t._raw?.date;
                const txnDate = txnDateRaw ? new Date(txnDateRaw) : null;
                return matchesLocation && matchesItem && txnDate && txnDate < cutoff;
            })
            .reduce((acc, t) => acc + (Number(t._raw?.qty) || 0), 0);
    }, [transactions, filters.fromDate, filters.location]);

    // Quantity on hand after To Date (inclusive) -- useful for the "after" row
    const qohAfterDate = useMemo(() => {
        const idToMatch = selectedItem || itemId;
        if (!filters.toDate) return null;
        const cutoff = new Date(filters.toDate);
        cutoff.setHours(23, 59, 59, 999);

        return transactions
            .filter((t) => {
                const matchesLocation = !filters.location || String(t.loc_code ?? t._raw?.loc_code ?? t.location) === String(filters.location);
                const rawStockId = t._raw?.stock_id ?? t._raw?.stock?.stock_id ?? t._raw?.stockmaster_id ?? t._raw?.stock_master_id;
                const matchesItem = !idToMatch || String(rawStockId) === String(idToMatch);
                const txnDateRaw = t.date ?? t._raw?.tran_date ?? t._raw?.tranDate ?? t._raw?.date;
                const txnDate = txnDateRaw ? new Date(txnDateRaw) : null;
                return matchesLocation && matchesItem && txnDate && txnDate <= cutoff;
            })
            .reduce((acc, t) => acc + (Number(t._raw?.qty) || 0), 0);
    }, [transactions, filters.toDate, filters.location]);

    // Totals for the currently filtered data (between from/to and location)
    const totals = useMemo(() => {
        const sumIn = filteredData.reduce((acc, t) => acc + (Number(t.quantityIn) || 0), 0);
        const sumOut = filteredData.reduce((acc, t) => acc + (Number(t.quantityOut) || 0), 0);
    // final QOH for filteredData: prefer the latest transaction's quantityOnHand if available
    // since transactions are oldest->newest, the latest is the last element
    const finalQoh = filteredData.length > 0 ? Number(filteredData[filteredData.length - 1].quantityOnHand) : (qohBeforeDate ?? 0);
        return { sumIn, sumOut, finalQoh };
    }, [filteredData, qohBeforeDate]);

    // Require item selection and both dates before showing data
    const selectionMade = Boolean(selectedItem || itemId);
    const datesSelected = Boolean(filters.fromDate && filters.toDate);
    const dataReady = selectionMade && datesSelected;

    // Reset pagination when data becomes ready
    useEffect(() => {
        if (dataReady) setPage(0);
    }, [dataReady]);

    const handleChangePage = (_event: any, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Inventory Item Movement" },
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
                    position: "relative",
                }}
            >
                <Box>
                    <PageTitle title="Fixed Asset Movements" />
                    <Breadcrumb breadcrumbs={breadcrumbItems} />
                </Box>

                <Box sx={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ minWidth: 280 }}>
                        <ItemSearchSelect
                            label="Select Item"
                            selectedStockId={String(selectedItem ?? "")}
                            items={items as any[]}
                            categories={categories.map((cat) => ({
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
                            const found = locations.find((l) => String(l.locationCode) === String(selected));
                            return found ? found.locationName : String(selected);
                        },
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="">All</MenuItem>
                    {locations.map((loc) => (
                        <MenuItem key={loc.locationCode} value={String(loc.locationCode)}>
                            {loc.locationName}
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
                <Button variant="contained" onClick={loadMovements} disabled={loading}>
                    {loading ? "Loading..." : "Search"}
                </Button>
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
                            {!selectionMade ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <Typography variant="body2">Please select an Item to view movements.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : !datesSelected ? (
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
