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
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import SearchBar from "../../../../components/SearchBar";
import theme from "../../../../theme";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
    deleteAppTheme,
    getAppThemes,
    updateAppTheme,
} from "../../../../api/Setup/AppSetupApi";
import { useSnackbar } from "notistack";

export default function InstallThemes() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [themes, setThemes] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const load = () => getAppThemes().then((data) => setThemes(data));

    useEffect(() => {
        load();
    }, []);

    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return themes;
        const lower = searchQuery.toLowerCase();
        return themes.filter(
            (t) =>
                t.name.toLowerCase().includes(lower) ||
                t.installed.toString().toLowerCase().includes(lower) ||
                String(t.version ?? t.available ?? "").toLowerCase().includes(lower) ||
                t.id.toString().includes(lower)
        );
    }, [themes, searchQuery]);

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

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this theme?")) return;
        try {
            await deleteAppTheme(id);
            enqueueSnackbar("Theme removed.", { variant: "success" });
            load();
        } catch {
            enqueueSnackbar("Failed to delete theme.", { variant: "error" });
        }
    };

    const handleInstallUpdate = async (row: { id: number; installed: boolean; name: string }) => {
        try {
            await updateAppTheme(row.id, { installed: !row.installed });
            enqueueSnackbar(row.installed ? "Theme uninstalled." : "Theme installed.", {
                variant: "success",
            });
            load();
        } catch {
            enqueueSnackbar("Failed to update theme.", { variant: "error" });
        }
    };

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Themes" },
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
                        placeholder="Search Themes"
                    />
                </Box>
            </Stack>

            <Stack sx={{ alignItems: "center" }}>
                <TableContainer
                    component={Paper}
                    elevation={2}
                    sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
                >
                    <Table aria-label="themes table">
                        <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Theme</TableCell>
                                <TableCell>Installed</TableCell>
                                <TableCell>Available</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((t) => (
                                    <TableRow key={t.id} hover>
                                        <TableCell>{t.id}</TableCell>
                                        <TableCell>{t.name}</TableCell>
                                        <TableCell>{t.installed ? "Yes" : "No"}</TableCell>
                                        <TableCell>{t.available}</TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => handleInstallUpdate(t)}
                                                >
                                                    {t.installed ? "Update" : "Install"}
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="error"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleDelete(t.id)}
                                                >
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
