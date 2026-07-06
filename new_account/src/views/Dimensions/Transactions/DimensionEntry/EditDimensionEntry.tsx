import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  useTheme,
  useMediaQuery,
  Alert,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import { getTags } from "../../../../api/DimensionTag/DimensionTagApi";
import {
  deleteDimension,
  getDimension,
  updateDimension,
} from "../../../../api/Dimension/DimensionApi";

function EditDimensionEntry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [formData, setFormData] = useState({
    dimensionReference: "",
    name: "",
    type: "1",
    startDate: "",
    dateRequiredBy: "",
    tags: "",
    memo: "",
    closed: false,
  });
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: tags = [] } = useQuery({ queryKey: ["dimensionTags"], queryFn: getTags });

  useEffect(() => {
    if (!id) return;
    getDimension(id)
      .then((d) => {
        setFormData({
          dimensionReference: d.reference || "",
          name: d.name || "",
          type: String(d.type || 1),
          startDate: d.start_date ? String(d.start_date).split("T")[0] : "",
          dateRequiredBy: d.date_required_by ? String(d.date_required_by).split("T")[0] : "",
          tags: d.tag_id ? String(d.tag_id) : "",
          memo: d.memo || "",
          closed: Boolean(d.closed),
        });
      })
      .catch(() => setSaveError("Could not load dimension."));
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSelectChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const buildPayload = () => ({
    reference: formData.dimensionReference.trim(),
    name: formData.name.trim(),
    type: Number(formData.type) || 1,
    start_date: formData.startDate || undefined,
    date_required_by: formData.dateRequiredBy || undefined,
    tag_id: formData.tags ? Number(formData.tags) : null,
    memo: formData.memo || undefined,
    closed: formData.closed,
  });

  const handleUpdate = async () => {
    if (!id) return;
    setIsSaving(true);
    setSaveError("");
    try {
      await updateDimension(id, buildPayload());
      navigate("/dimension/inquiriesandreports/dimension-inquiry");
    } catch (error: unknown) {
      const err = error as { message?: string };
      setSaveError(err?.message || "Failed to update dimension.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseDimension = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await updateDimension(id, { ...buildPayload(), closed: true });
      navigate("/dimension/inquiriesandreports/dimension-inquiry");
    } catch {
      setSaveError("Failed to close dimension.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDimension = async () => {
    if (!id || !window.confirm("Delete this dimension? This cannot be undone.")) return;
    try {
      await deleteDimension(id);
      navigate("/dimension/inquiriesandreports/dimension-inquiry");
    } catch {
      setSaveError("Failed to delete dimension.");
    }
  };

  return (
    <Stack>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          marginY: 2,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <PageTitle title="Edit Dimension" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Home", href: "/dashboard" },
              { title: "Dimension Inquiry", href: "/dimension/inquiriesandreports/dimension-inquiry" },
              { title: "Edit" },
            ]}
          />
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
        <Paper sx={{ p: theme.spacing(3), maxWidth: "600px", width: "100%", boxShadow: 2, borderRadius: 2 }}>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField
              label="Dimension Reference"
              name="dimensionReference"
              size="small"
              fullWidth
              value={formData.dimensionReference}
              onChange={handleInputChange}
            />
            <TextField
              label="Name"
              name="name"
              size="small"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select name="type" value={formData.type} onChange={handleSelectChange} label="Type">
                <MenuItem value="1">Dimension 1</MenuItem>
                <MenuItem value="2">Dimension 2</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              size="small"
              fullWidth
              value={formData.startDate}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Date required by"
              name="dateRequiredBy"
              type="date"
              size="small"
              fullWidth
              value={formData.dateRequiredBy}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Tag</InputLabel>
              <Select name="tags" value={formData.tags} onChange={handleSelectChange} label="Tag">
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {tags.map((tag: { id: number; tagName: string }) => (
                  <MenuItem key={tag.id} value={String(tag.id)}>
                    {tag.tagName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Memo"
              name="memo"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={formData.memo}
              onChange={handleInputChange}
            />
            <FormControlLabel
              control={
                <Checkbox name="closed" checked={formData.closed} onChange={handleInputChange} />
              }
              label="Closed"
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 3 }} justifyContent="flex-end">
            <Button color="error" variant="outlined" onClick={handleDeleteDimension}>
              Delete
            </Button>
            <Button variant="outlined" onClick={handleCloseDimension} disabled={isSaving || formData.closed}>
              Close dimension
            </Button>
            <Button
              variant="contained"
              disabled={isSaving}
              sx={{ backgroundColor: "var(--pallet-blue)" }}
              onClick={handleUpdate}
            >
              {isSaving ? "Saving…" : "Update"}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Stack>
  );
}

export default EditDimensionEntry;
