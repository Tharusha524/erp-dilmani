import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import { useAuth } from "../../../../context/AuthContext";
import {
  deleteLoginSlideshowImage,
  getLoginSlideshowImages,
  reorderLoginSlideshowImages,
  uploadLoginSlideshowImage,
} from "../../../../api/LoginSlideshow/LoginSlideshowApi";

export default function SlideshowImagesTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { hasEditPermission } = useAuth();
  const canEdit = hasEditPermission("Login slideshow images");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["loginSlideshowImagesAdmin"],
    queryFn: getLoginSlideshowImages,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["loginSlideshowImagesAdmin"] });

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadLoginSlideshowImage(file);
      enqueueSnackbar("Image uploaded successfully", { variant: "success" });
      refresh();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || "Failed to upload image", { variant: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteLoginSlideshowImage(id);
      enqueueSnackbar("Image deleted successfully", { variant: "success" });
      refresh();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || "Failed to delete image", { variant: "error" });
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    try {
      await reorderLoginSlideshowImages(reordered.map((img) => img.id));
      refresh();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || "Failed to reorder images", { variant: "error" });
    }
  };

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Setup", href: "/setup" },
    { title: "Maintenance", href: "/setup/maintenance" },
    { title: "Slideshow Images" },
  ];

  return (
    <FormPageLayout>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <PageTitle title="Slideshow Images" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            These images cycle on the Login and Sign Up pages. Use the arrows to change display order.
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            onClick={handleUploadClick}
            disabled={!canEdit || uploading}
          >
            {uploading ? "Uploading..." : "Add Image"}
          </Button>
        </Stack>

        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : images.length === 0 ? (
          <Typography color="text.secondary">
            No images uploaded yet — the login page is showing its built-in default images.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {images.map((img, index) => (
              <Grid item xs={12} sm={6} md={4} key={img.id}>
                <Paper variant="outlined" sx={{ p: 1 }}>
                  <Box
                    component="img"
                    src={img.url}
                    alt={`Slide ${index + 1}`}
                    sx={{
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Slide {index + 1}</Typography>
                    <Stack direction="row">
                      <IconButton
                        size="small"
                        disabled={!canEdit || index === 0}
                        onClick={() => handleMove(index, -1)}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={!canEdit || index === images.length - 1}
                        onClick={() => handleMove(index, 1)}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={!canEdit}
                        onClick={() => handleDelete(img.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </FormPageLayout>
  );
}
