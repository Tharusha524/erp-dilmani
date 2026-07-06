import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  colors,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { DrawerContentItem } from "../../components/ViewDataDrawer";
import useIsMobile from "../../customHooks/useIsMobile";
import { User } from "../../api/userApi"; // Keep User type if needed; adjust if in usermanagement.ts
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import queryClient from "../../state/queryClient";
import { enqueueSnackbar } from "notistack";
import { DrawerUpdateButtons } from "../../components/ViewProfileDataDrawer";
import UpdateUserProfile from "./UpdateUserProfileDialog";
import useCurrentUser from "../../hooks/useCurrentUser";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ProfileImage from "../../components/ProfileImageComponent";
// import PasswordResetDialog from "./OpenPasswordResetDiaolg"; // Commented out as resets not needed
// import ResetEmailDialog from "./OpenEmailResetDialog"; // Commented out as resets not needed
import CustomButton from "../../components/CustomButton";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
// Import from usermanagement API
import { updateUser } from "../../api/UserManagement/userManagement";

function ViewUserContent({ selectedUser }: { selectedUser: User }) {
  const { isTablet } = useIsMobile();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { user } = useCurrentUser();

  // When this profile view is mounted, refetch the user data so
  // any external edits (for example, by an admin) are reflected
  // immediately when navigating to the profile page.
  useEffect(() => {
    if (selectedUser?.id) {
      queryClient.invalidateQueries({ queryKey: ["user", selectedUser.id], refetchType: "all" });
    }
    // Also refresh current-user in case this view is showing the logged-in user
    queryClient.invalidateQueries({ queryKey: ["current-user"], refetchType: "all" });
  }, [selectedUser?.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const statusColor = selectedUser?.availability ? "#44b700" : "#f44336";

  const { mutate: profileUpdateMutation, isPending } = useMutation({
    mutationFn: ({ id, imageFile, removeImage = false }: { id: number; imageFile?: File; removeImage?: boolean }) => {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (removeImage) {
        formData.append('remove_image', 'true');
      }
      // No other fields—backend now allows partial
      return updateUser(id.toString(), formData);
    },
    onSuccess: (response) => {
      console.log('Image upload success:', response); // Debug log

      // Clear the image states first
      setImagePreview(null);
      setImageFile(null);

  // Invalidate queries to refresh data from server. Use refetchType: 'all' to ensure refetch
  queryClient.invalidateQueries({ queryKey: ["current-user"], refetchType: 'all' });
  queryClient.invalidateQueries({ queryKey: ["user", selectedUser.id], refetchType: 'all' });
  queryClient.invalidateQueries({ queryKey: ["user-managements"], refetchType: 'all' });

      enqueueSnackbar("Profile image updated successfully!", { variant: "success" });
    },
    onError: (error) => {
      console.error('Image upload error:', error); // Debug log
      enqueueSnackbar("Profile image update failed", { variant: "error" });
    },
  });

  const saveImage = () => {
    if (imageFile && selectedUser.id) {
      profileUpdateMutation({ id: selectedUser.id, imageFile });
    }
  };

  const removeImage = () => {
    if (selectedUser.id && !imageFile) { // Only if no new image selected
      profileUpdateMutation({ id: selectedUser.id, removeImage: true });
    }
  };

  const [openViewProfileDrawer, setOpenViewProfileDrawer] = useState(false);
  const [openEditUserRoleDialog, setOpenEditUserRoleDialog] = useState(false);
  // const [openEditUserPasswordResetDialog, setOpenEditUserPasswordResetDialog] = useState(false); // Commented out
  // const [openEditUserEmailResetDialog, setOpenEditUserEmailResetDialog] = useState(false); // Commented out

  return (
    <Stack
      sx={{
        display: "flex",
        flexDirection: isTablet ? "column" : "row",
        px: "1rem",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        my: 2,
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          p: "3rem",
        }}
        gap={2}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          variant="dot"
          sx={{
            "& .MuiBadge-badge": {
              backgroundColor: statusColor,
              color: statusColor,
              boxShadow: "0 0 0 2px white",
              height: "16px",
              width: "16px",
              borderRadius: "50%",
            },
          }}
        >
          <ProfileImage
            name={`${selectedUser?.first_name ?? ""} ${selectedUser?.last_name ?? ""}`.trim()}
            // Support multiple possible backend field names for the stored image
            imageUrl={
              selectedUser?.image_url ??
              selectedUser?.image ??
              (selectedUser as any)?.imageUrl ??
              (selectedUser as any)?.profile_image_url ??
              (selectedUser as any)?.profile_image ??
              undefined
            }
            files={imageFile ? [imageFile] : undefined}
            fontSize="5rem"
          />
        </Badge>
        <Typography
          variant="h4"
          textAlign={"center"}
          sx={{
            fontSize: "1.5rem",
            color: "var(--pallet-dark-blue)",
          }}
        >
          {`${selectedUser?.first_name ?? ""} ${selectedUser?.last_name ?? ""}`.trim()}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: isTablet ? "column" : "row",
          }}
          gap={2}
        >
          <CustomButton variant="outlined" component="label" sx={{ mt: 2 }}>
            Change Profile Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </CustomButton>
          {imageFile && (
            <CustomButton
              variant="contained"
              onClick={saveImage}
              sx={{ mt: 2, backgroundColor: "var(--pallet-blue)" }}
              disabled={isPending}
              endIcon={
                isPending && (
                  <CircularProgress size={20} sx={{ color: "gray" }} />
                )
              }
            >
              Save
            </CustomButton>
          )}
          {selectedUser?.image_url && !imageFile && (
            <CustomButton
              variant="outlined"
              color="error"
              onClick={removeImage}
              sx={{ mt: 2 }}
              disabled={isPending}
            >
              Remove Image
            </CustomButton>
          )}
        </Box>
      </Box>
      <Stack
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fff",
          flex: 2,
          p: "3rem",
        }}
      >
        <Stack
          mb={4}
          sx={{
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <Box>
            <>
              {isTablet ? (
                <IconButton
                  aria-label="edit"
                  onClick={() => setOpenEditUserRoleDialog(true)}
                >
                  <EditOutlinedIcon sx={{ color: "var(--pallet-blue)" }} />
                </IconButton>
              ) : (
                <CustomButton
                  variant="contained"
                  sx={{ backgroundColor: "var(--pallet-blue)" }}
                  size="medium"
                  onClick={() => setOpenEditUserRoleDialog(true)}
                  startIcon={<EditOutlinedIcon />}
                >
                  Edit My Profile
                </CustomButton>
              )}
            </>
          </Box>
        </Stack>
        <Stack direction={isTablet ? "column" : "row"}>
          <DrawerContentItem
            label="Employee Id"
            value={selectedUser?.id}
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Email"
            value={selectedUser?.email}
            sx={{ flex: 1 }}
          />
        </Stack>
        <Stack direction={isTablet ? "column" : "row"}>
          <DrawerContentItem
            label="Full Name"
             value={`${selectedUser?.first_name ?? ""} ${selectedUser?.last_name ?? ""}`.trim()}
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Mobile Number"
            value={selectedUser?.telephone}
            sx={{ flex: 1 }}
          />
        </Stack>
        <Stack direction={isTablet ? "column" : "row"}>
          <DrawerContentItem
            label="Designation"
            value={selectedUser?.role}
            sx={{ flex: 1 }}
          />
        </Stack>
        <Stack
          sx={{
            mt: "1rem",
          }}
        >
          {/* DANGER ZONE (commented out) */}
        </Stack>
      </Stack>
      {openEditUserRoleDialog && (
        <UpdateUserProfile
          open={openEditUserRoleDialog}
          handleClose={() => {
            setOpenViewProfileDrawer(true);
            setOpenEditUserRoleDialog(false);
          }}
          defaultValues={user}
        />
      )}
      {/* Commented out reset dialogs as not needed right now
      {openEditUserPasswordResetDialog && (
        <PasswordResetDialog
          open={openEditUserPasswordResetDialog
          handleClose={() => {
            setOpenEditUserPasswordResetDialog(false);
            setOpenEditUserRoleDialog(false);
          }}
          onSubmit={(data) => {}}
          defaultValues={user}
        />
      )}
      {openEditUserEmailResetDialog && (
        <ResetEmailDialog
          open={openEditUserEmailResetDialog}
          handleClose={() => {
            setOpenEditUserEmailResetDialog(false);
            setOpenEditUserRoleDialog(false);
          }}
          defaultValues={user}
        />
      )}
      */}
    </Stack>
  );
}

export default ViewUserContent;