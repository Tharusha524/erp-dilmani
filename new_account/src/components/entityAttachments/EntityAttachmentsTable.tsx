import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Box,
  Button,
  Stack,
  TableFooter,
  TablePagination,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { useMemo, useState, useEffect, useCallback } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import SearchBar from "../SearchBar";
import {
  deleteEntityAttachment,
  downloadEntityAttachment,
  EntityAttachment,
  EntityAttachmentType,
  getEntityAttachments,
} from "../../api/Attachments/AttachmentsApi";
import { useMessageDialog } from "../../context/MessageDialogContext";

interface EntityAttachmentsTableProps {
  entityType: EntityAttachmentType;
  entityId: string | number;
  onAdd?: () => void;
}

export default function EntityAttachmentsTable({
  entityType,
  entityId,
  onAdd,
}: EntityAttachmentsTableProps) {
  const { showSuccess } = useMessageDialog();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [attachments, setAttachments] = useState<EntityAttachment[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAttachments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEntityAttachments(entityType, entityId, showInactive);
      setAttachments(data);
    } catch {
      // Error dialog shown by API interceptor
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, showInactive]);

  useEffect(() => {
    if (entityId) {
      loadAttachments();
    }
  }, [entityId, loadAttachments]);

  const filteredData = useMemo(() => {
    let data = showInactive ? attachments : attachments.filter((a) => !a.inactive);
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      data = data.filter(
        (a) =>
          a.doc_title.toLowerCase().includes(lower) ||
          a.original_filename.toLowerCase().includes(lower) ||
          a.filetype.toLowerCase().includes(lower)
      );
    }
    return data;
  }, [attachments, showInactive, searchQuery]);

  const paginatedData = useMemo(() => {
    if (rowsPerPage === -1) return filteredData;
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, filteredData]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this attachment?")) return;
    try {
      await deleteEntityAttachment(id);
      showSuccess("Attachment deleted.");
      loadAttachments();
    } catch {
      // Error dialog shown by API interceptor
    }
  };

  const handleDownload = async (row: EntityAttachment) => {
    try {
      await downloadEntityAttachment(row.id, row.original_filename);
    } catch {
      // Error dialog shown by API interceptor
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <FormControlLabel
          control={
            <Checkbox checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          }
          label="Show Also Inactive"
        />
        <Box sx={{ width: 300 }}>
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} placeholder="Search attachments" />
        </Box>
        {onAdd && (
          <Button variant="contained" onClick={onAdd}>
            Add Attachment
          </Button>
        )}
      </Stack>

      {loading ? (
        <Stack alignItems="center" py={4}>
          <CircularProgress size={32} />
        </Stack>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Doc Title</TableCell>
                <TableCell>Filename</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Doc Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length ? (
                paginatedData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.doc_title}</TableCell>
                    <TableCell>{row.original_filename}</TableCell>
                    <TableCell>{row.formatted_size}</TableCell>
                    <TableCell>{row.filetype}</TableCell>
                    <TableCell>{row.doc_date}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleDownload(row)} aria-label="download">
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(row.id)} aria-label="delete">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={2}>
                      No attachments found.
                    </Typography>
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
                  onPageChange={(_, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
