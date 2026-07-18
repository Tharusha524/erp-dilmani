import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import Paper from "@mui/material/Paper";
import {
    Box,
    Button,
    Stack,
    Typography,
    useMediaQuery,
    Theme,
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import SearchBar from "../../../../components/SearchBar";
import theme from "../../../../theme";
import { useNavigate } from "react-router";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// Mock API
const getSoftwareUpdates = async () => [
    {
        id: 1,
        company: "ABC Ltd.",
        tableSet: "Sales",
        currentVersion: "1.0.2",
        lastLog: "2025-09-15",
    },
    {
        id: 2,
        company: "XYZ Corp.",
        tableSet: "Inventory",
        currentVersion: "2.3.1",
        lastLog: "2025-09-10",
    },
];

export default function SoftwareUpdateTable() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [updates, setUpdates] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
    const navigate = useNavigate();

    useEffect(() => {
        getSoftwareUpdates().then((data) => setUpdates(data));
    }, []);

    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return updates;
        const lower = searchQuery.toLowerCase();
        return updates.filter(
            (u) =>
                u.company.toLowerCase().includes(lower) ||
                u.tableSet.toLowerCase().includes(lower) ||
                u.currentVersion.toLowerCase().includes(lower) ||
                u.lastLog.toLowerCase().includes(lower) ||
                u.id.toString().includes(lower)
        );
    }, [updates, searchQuery]);

    const paginatedData = useMemo(() => {
        if (rowsPerPage === -1) return filteredData;
        return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredData, page, rowsPerPage]);

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) =>
        setPage(newPage);

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleUpgrade = (update: any) => {
        alert(`Upgrade ${update.company} - ${update.tableSet} (v${update.currentVersion})`);
    };

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Software Updates" },
    ];

    return (
        <FormPageLayout>
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
                    <PageTitle title="Themes" />
                    <Breadcrumb breadcrumbs={breadcrumbItems} />
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/setup/maintenance")}
                    >
                        Back
                    </Button>
                </Stack>
            </Box>
            {/* Search */}
            <Stack
                direction={isMobile ? "column" : "row"}
                spacing={2}
                sx={{ px: 2, mb: 2, alignItems: "center", justifyContent: "flex-end" }}
            >
                <Box sx={{ width: isMobile ? "100%" : "300px" }}>
                    <SearchBar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        placeholder="Search Updates"
                    />
                </Box>
            </Stack>
            <Stack sx={{ alignItems: "center" }}>
                <TableContainer
                    component={Paper}
                    elevation={2}
                    sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
                >
                    <Table aria-label="software updates table">
                        <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Company</TableCell>
                                <TableCell>Table Set</TableCell>
                                <TableCell>Current Version</TableCell>
                                <TableCell>Last Log</TableCell>
                                <TableCell align="center">Upgrade</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((u) => (
                                    <TableRow key={u.id} hover>
                                        <TableCell>{u.id}</TableCell>
                                        <TableCell>{u.company}</TableCell>
                                        <TableCell>{u.tableSet}</TableCell>
                                        <TableCell>{u.currentVersion}</TableCell>
                                        <TableCell>{u.lastLog}</TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleUpgrade(u)}
                                            >
                                                Upgrade
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography variant="body2">No Records Found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                                    colSpan={6}
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
        </FormPageLayout>
    );
}
