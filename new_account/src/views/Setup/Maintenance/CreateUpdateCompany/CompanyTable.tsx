import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button,
  Stack,
  TableFooter,
  TablePagination,
  Typography,
  useMediaQuery,
  Theme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import SearchBar from "../../../../components/SearchBar";

// Mock API
const getCompanies = async () => [
  {
    id: 1,
    company: "Acme Ltd",
    host: "localhost",
    port: "3306",
    dbUser: "root",
    dbName: "acme_db",
    tablePref: "ac_",
    charset: "utf8",
    default: true,
  },
  {
    id: 2,
    company: "Beta Corp",
    host: "192.168.1.100",
    port: "3306",
    dbUser: "admin",
    dbName: "beta_db",
    tablePref: "bt_",
    charset: "utf8mb4",
    default: false,
  },
];

export default function CompanyTable() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const navigate = useNavigate();

  useEffect(() => {
    getCompanies().then((data) => setCompanies(data));
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return companies;

    const lower = searchQuery.toLowerCase();
    return companies.filter(
      (c) =>
        c.company.toLowerCase().includes(lower) ||
        c.host.toLowerCase().includes(lower) ||
        c.port.toLowerCase().includes(lower) ||
        c.dbUser.toLowerCase().includes(lower) ||
        c.dbName.toLowerCase().includes(lower) ||
        c.tablePref.toLowerCase().includes(lower) ||
        c.charset.toLowerCase().includes(lower) ||
        (c.default ? "true" : "false").includes(lower)
    );
  }, [companies, searchQuery]);

  const paginatedData = useMemo(() => {
    if (rowsPerPage === -1) return filteredData;
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, filteredData]);

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) =>
    setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = (id: number) => {
    alert(`Delete company with id: ${id}`);
  };

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Companies" },
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
          <PageTitle title="Companies" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/setup/maintenance/add-company")}
          >
            Add Company
          </Button>

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
            placeholder="Search Companies"
          />
        </Box>
      </Stack>

      <Stack sx={{ alignItems: "center" }}>
        <TableContainer
          component={Paper}
          elevation={2}
          sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
        >
          <Table aria-label="companies table">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Database Host</TableCell>
                <TableCell>Database Port</TableCell>
                <TableCell>Database User</TableCell>
                <TableCell>Database Name</TableCell>
                <TableCell>Table Prefix</TableCell>
                <TableCell>Charset</TableCell>
                <TableCell>Default</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.id}</TableCell>
                    <TableCell>{c.company}</TableCell>
                    <TableCell>{c.host}</TableCell>
                    <TableCell>{c.port}</TableCell>
                    <TableCell>{c.dbUser}</TableCell>
                    <TableCell>{c.dbName}</TableCell>
                    <TableCell>{c.tablePref}</TableCell>
                    <TableCell>{c.charset}</TableCell>
                    <TableCell>{c.default ? "Yes" : "No"}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() =>
                            navigate(`/setup/maintenance/update-company/${c.id}`)
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(c.id)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2">No Records Found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={10}
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
