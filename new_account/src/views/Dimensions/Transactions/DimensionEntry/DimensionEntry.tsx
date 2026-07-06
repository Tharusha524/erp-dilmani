import React, { useState } from "react";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import { getTags } from "../../../../api/DimensionTag/DimensionTagApi";
import { createDimension, getDimensions } from "../../../../api/Dimension/DimensionApi";

interface DimensionFormData {
  dimensionReference: string;
  name: string;
  type: string;
  startDate: string;
  dateRequiredBy: string;
  tags: string;
  memo: string;
}

function DimensionEntry() {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<DimensionFormData>({
    dimensionReference: "",
    name: "",
    type: "1",
    startDate: new Date().toISOString().split("T")[0],
    dateRequiredBy: "",
    tags: "",
    memo: "",
  });
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: tags = [] } = useQuery({ queryKey: ["dimensionTags"], queryFn: getTags });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.dimensionReference.trim() || !formData.name.trim()) {
      setSaveError("Reference and name are required.");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    try {
      const existing = await getDimensions();
      const duplicate = existing.some(
        (d) => String(d.reference).toLowerCase() === formData.dimensionReference.trim().toLowerCase()
      );
      if (duplicate) {
        setSaveError("A dimension with this reference already exists.");
        return;
      }

      await createDimension({
        reference: formData.dimensionReference.trim(),
        name: formData.name.trim(),
        type: Number(formData.type) || 1,
        start_date: formData.startDate || undefined,
        date_required_by: formData.dateRequiredBy || undefined,
        tag_id: formData.tags ? Number(formData.tags) : null,
        memo: formData.memo || undefined,
        closed: false,
      });

      navigate("/dimension/transactions/dimension-entry/success", {
        state: { reference: formData.dimensionReference },
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      setSaveError(err?.message || "Failed to save dimension.");
    } finally {
      setIsSaving(false);
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
          <PageTitle title="Dimension Entry" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Home", href: "/dashboard" },
              { title: "Dimensions", href: "/dimension/transactions" },
              { title: "Dimension Entry" },
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
              required
              value={formData.dimensionReference}
              onChange={handleInputChange}
            />
            <TextField
              label="Name"
              name="name"
              size="small"
              fullWidth
              required
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
          </Stack>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              variant="contained"
              disabled={isSaving}
              sx={{ backgroundColor: "var(--pallet-blue)" }}
              onClick={handleSubmit}
            >
              {isSaving ? "Saving…" : "Add New"}
            </Button>
          </Box>
        </Paper>
      </Stack>
    </Stack>
  );
}

export default DimensionEntry;
