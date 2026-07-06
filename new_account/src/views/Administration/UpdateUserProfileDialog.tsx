import {
  Autocomplete,
  Box,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { grey } from "@mui/material/colors";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import CustomButton from "../../components/CustomButton";
import useIsMobile from "../../customHooks/useIsMobile";
import { User } from "../../api/userApi"; // Keep User type if needed for typing
import { updateUser } from "../../api/UserManagement/userManagement";
import queryClient from "../../state/queryClient";
import { genderOptions } from "../../constants/accidentConstants";

type DialogProps = {
  open: boolean;
  handleClose: () => void;
  defaultValues?: User;
};

export default function UpdateUserProfile({
  open,
  handleClose,
  defaultValues,
}: DialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { isTablet } = useIsMobile();

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
    register,
    setValue,
  } = useForm<User>({
    defaultValues: {
      ...defaultValues,
    },
  });

  const { mutate: profileUpdateMutation, isPending } = useMutation({
    mutationFn: async (payload: any) => {
      const { id, ...data } = payload;
      return updateUser(id?.toString?.() ?? String(id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      enqueueSnackbar("Profile updated successfully!", { variant: "success" });
      handleClose();
    },
    onError: () => {
      enqueueSnackbar("Profile update failed", { variant: "error" });
    },
  });

  useEffect(() => {
    if (defaultValues) {
      // Ensure the form has the expected fields populated
      reset({
        first_name: defaultValues.first_name ?? "",
        last_name: defaultValues.last_name ?? "",
        email: defaultValues.email ?? "",
        telephone: defaultValues.telephone ?? "",
      } as any);
    } else {
      reset();
    }
  }, [defaultValues, reset]);

  const resetForm = () => {
    reset();
  };

  const onSubmitForm = (data: any) => {
    // Only send allowed fields: first_name, last_name, email, telephone
    profileUpdateMutation({
      id: defaultValues?.id ?? data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      telephone: data.telephone,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm();
        handleClose();
      }}
      PaperProps={{
        style: {
          backgroundColor: grey[50],
          minWidth: "500px",
        },
        component: "form",
      }}
    >
      <DialogTitle
        sx={{
          paddingY: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" component="div">
          Update User Profile
        </Typography>
        <IconButton
          onClick={handleClose}
          edge="start"
          sx={{ color: "#024271" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Stack direction="column" gap={2} sx={{ mt: 1 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              id="first_name"
              type="text"
              label="First Name"
              required
              error={!!errors.first_name}
              helperText={errors.first_name ? "Required *" : ""}
              size="small"
              fullWidth
              {...register("first_name", { required: true })}
            />

            <TextField
              id="last_name"
              type="text"
              label="Last Name"
              required
              error={!!errors.last_name}
              helperText={errors.last_name ? "Required *" : ""}
              size="small"
              fullWidth
              {...register("last_name", { required: true })}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              id="email"
              type="email"
              label="Email"
              required
              error={!!errors.email}
              helperText={errors.email ? "Required *" : ""}
              size="small"
              fullWidth
              {...register("email", { required: true })}
            />

            <TextField
              id="telephone"
              type="text"
              label="Mobile Number"
              required
              error={!!errors.telephone}
              helperText={errors.telephone ? "Required *" : ""}
              size="small"
              fullWidth
              {...register("telephone", { required: true })}
            />
          </Box>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ padding: "1rem" }}>
        <Button
          onClick={() => {
            resetForm();
            handleClose();
          }}
          sx={{ color: "var(--pallet-blue)" }}
        >
          Cancel
        </Button>
        <CustomButton
          variant="contained"
          sx={{ backgroundColor: "var(--pallet-blue)" }}
          disabled={isPending}
          size="medium"
          onClick={handleSubmit(onSubmitForm)}
        >
          {defaultValues ? "Update Changes" : "Assign Role"}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
