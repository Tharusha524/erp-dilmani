import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Stack,
  TableFooter,
  TablePagination,
  Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import theme from "../../theme";
import PageTitle from "../../components/PageTitle";
import Breadcrumb from "../../components/BreadCrumb";
import { useMemo, useState } from "react";
import ViewDataDrawer, { DrawerHeader } from "../../components/ViewDataDrawer";
import AddIcon from "@mui/icons-material/Add";
import AddorEditSustainabilityDialog from "./AddorEditSustainabilityDialog";
import { Document } from "../../api/documentApi";
import { format } from "date-fns";
import SustainabilityContent from "./ViewSustainabilityContent";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import { useSnackbar } from "notistack";
import { useMutation, useQuery } from "@tanstack/react-query";
import queryClient from "../../state/queryClient";
import useCurrentUserHaveAccess from "../../hooks/useCurrentUserHaveAccess";
import { PermissionKeys } from "../Administration/SectionList";
import MultiTableCell from "../../components/MultiTableCell";
import {
  createSustainabilityReport,
  deleteSustainabilityRecord,
  getSustainabilityList,
  updateSustainabilityReport,
} from "../../api/Sustainability/sustainabilityApi";

function SustainabilityTable() {
  const { enqueueSnackbar } = useSnackbar();
  const [openViewDrawer, setOpenViewDrawer] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Document>(null);
  const [openAddOrEditDialog, setOpenAddOrEditDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // handle pagination
  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Sustainability" },
  ];

  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("md")
  );

  const { data: sustainabilityData, isFetching: isSustainabilityDataFetching } =
    useQuery({
      queryKey: ["sustainabilityReports"],
      queryFn: getSustainabilityList,
    });

  const { mutate: createSustainabilityMutation } = useMutation({
    mutationFn: createSustainabilityReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sustainabilityReports"] });
      enqueueSnackbar("Sustainability Record Created Successfully!", {
        variant: "success",
      });
      setSelectedRow(null);
      setOpenViewDrawer(false);
      setOpenAddOrEditDialog(false);
    },
    onError: () => {
      enqueueSnackbar(`Sustainability Record Creation Failed`, {
        variant: "error",
      });
    },
  });

  const { mutate: updateSustainabilityMutation } = useMutation({
    mutationFn: updateSustainabilityReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sustainabilityReports"] });
      enqueueSnackbar("Sustainability Record Updated Successfully!", {
        variant: "success",
      });
      setSelectedRow(null);
      setOpenViewDrawer(false);
      setOpenAddOrEditDialog(false);
    },
    onError: () => {
      enqueueSnackbar(`Sustainability Record Updation Failed`, {
        variant: "error",
      });
    },
  });

  const { mutate: deleteSustainabilityMutation } = useMutation({
    mutationFn: deleteSustainabilityRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sustainabilityReports"] });
      enqueueSnackbar("Sustainability Records Deleted Successfully!", {
        variant: "success",
      });
      setSelectedRow(null);
      setOpenViewDrawer(false);
      setOpenAddOrEditDialog(false);
    },
    onError: () => {
      enqueueSnackbar(`Sustainability Delete Delete Failed`, {
        variant: "error",
      });
    },
  });

  const paginatedSustainabilityData = useMemo(() => {
    if (!sustainabilityData) return [];
    if (rowsPerPage === -1) {
      return sustainabilityData; // If 'All' is selected, return all data
    }
    return sustainabilityData.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [sustainabilityData, page, rowsPerPage]);

  return (
    <Stack>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          marginY: 2,
          borderRadius: 1,
          overflowX: "hidden",
        }}
      >
        <PageTitle title="Sustainability Management" />
        <Breadcrumb breadcrumbs={breadcrumbItems} />
      </Box>
      <Stack sx={{ alignItems: "center" }}>
        <TableContainer
          component={Paper}
          elevation={2}
          sx={{
            overflowX: "auto",
            maxWidth: isMobile ? "88vw" : "100%",
          }}
        >
          <Box
            sx={{
              padding: theme.spacing(2),
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="contained"
              sx={{ backgroundColor: "var(--pallet-blue)" }}
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedRow(null);
                setOpenAddOrEditDialog(true);
              }}
              disabled={
                !useCurrentUserHaveAccess(
                  PermissionKeys.SUSTAINABILITY_SDG_REPORTING_CREATE
                )
              }
            >
              Add New Sustanability Report
            </Button>
          </Box>
          {isSustainabilityDataFetching && (
            <LinearProgress sx={{ width: "100%" }} />
          )}
          <Table aria-label="simple table">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Title</TableCell>
                <TableCell align="right">Location</TableCell>
                <TableCell align="right">Division</TableCell>
                <TableCell align="right">SDG Details</TableCell>
                <TableCell align="right">Pillars</TableCell>
                <TableCell align="right">Timeline</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSustainabilityData?.length > 0 ? (
                paginatedSustainabilityData.map((row) => (
                  <TableRow
                    key={`${row.id}${row.title}`}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSelectedRow(row);
                      setOpenViewDrawer(true);
                    }}
                  >
                    <TableCell align="left">{row.referenceNumber}</TableCell>
                    <TableCell align="right">{row.title}</TableCell>
                    <TableCell align="right">{row.location}</TableCell>
                    <TableCell align="right">{row.division}</TableCell>
                    <TableCell align="right">{row.sdg}</TableCell>
                    <MultiTableCell row={row} columnKey="pillars" />
                    <TableCell align="right">
                      {row.timeLines
                        ? format(new Date(row.timeLines), "yyyy-MM-dd")
                        : "N/A"}
                    </TableCell>
                    <TableCell align="right">{row.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2">
                      No Sustainability found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={100}
                  count={sustainabilityData?.length ?? 0}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  showFirstButton={true}
                  showLastButton={true}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Stack>
      <ViewDataDrawer
        open={openViewDrawer}
        fullScreen={true}
        handleClose={() => setOpenViewDrawer(false)}
        drawerContent={
          <Stack spacing={1} sx={{ paddingX: theme.spacing(1) }}>
            <DrawerHeader
              title="Sustainability Details"
              handleClose={() => setOpenViewDrawer(false)}
              onEdit={() => {
                setSelectedRow(selectedRow);
                setOpenAddOrEditDialog(true);
              }}
              disableEdit={
                !useCurrentUserHaveAccess(
                  PermissionKeys.SUSTAINABILITY_SDG_REPORTING_EDIT
                )
              }
              onDelete={() => setDeleteDialogOpen(true)}
              disableDelete={
                !useCurrentUserHaveAccess(
                  PermissionKeys.SUSTAINABILITY_SDG_REPORTING_DELETE
                )
              }
            />

            {selectedRow && (
              <Stack>
                <SustainabilityContent sustainability={selectedRow} />
              </Stack>
            )}
          </Stack>
        }
      />
      {openAddOrEditDialog && (
        <AddorEditSustainabilityDialog
          open={openAddOrEditDialog}
          handleClose={() => {
            setSelectedRow(null);
            setOpenViewDrawer(false);
            setOpenAddOrEditDialog(false);
          }}
          onSubmit={(data) => {
            if (selectedRow) {
              console.log("Updating document", data);
              updateSustainabilityMutation(data);
            } else {
              console.log("Adding new document", data);
              createSustainabilityMutation(data);
            }
            setSelectedRow(null);
            setOpenViewDrawer(false);
            setOpenAddOrEditDialog(false);
          }}
          defaultValues={selectedRow}
        />
      )}
      {deleteDialogOpen && (
        <DeleteConfirmationModal
          open={deleteDialogOpen}
          title="Remove Sustainability Report"
          content={
            <>
              Are you sure you want to remove this Sustainability?
              <Alert severity="warning" style={{ marginTop: "1rem" }}>
                This action is not reversible.
              </Alert>
            </>
          }
          handleClose={() => setDeleteDialogOpen(false)}
          deleteFunc={async () => {
            deleteSustainabilityMutation(selectedRow.id);
          }}
          onSuccess={() => {
            setOpenViewDrawer(false);
            setSelectedRow(null);
            setDeleteDialogOpen(false);
          }}
          handleReject={() => {
            setOpenViewDrawer(false);
            setSelectedRow(null);
            setDeleteDialogOpen(false);
          }}
        />
      )}
    </Stack>
  );
}

export default SustainabilityTable;
