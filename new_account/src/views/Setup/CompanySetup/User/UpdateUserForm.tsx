import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  FormHelperText,
  SelectChangeEvent,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import theme from "../../../../theme";
import { getUser, updateUser } from "../../../../api/UserManagement/userManagement";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getSecurityRoles } from "../../../../api/AccessSetup/AccessSetupApi";
import UpdateConfirmationModal from "../../../../components/UpdateConfirmationModal";
import ErrorModal from "../../../../components/ErrorModal";
import UserPasswordFields from "../../../../components/UserPasswordFields";
import { validatePassword } from "../../../../utils/passwordPolicy";

interface UserFormData {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  epf: string;
  telephone: string;
  address: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  status: string;
}


export default function UpdateUserForm() {
  const [open, setOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState<UserFormData>({
    id: "",
    firstName: "",
    lastName: "",
    department: "",
    epf: "",
    telephone: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    status: "",
  });

  const [errors, setErrors] = useState<Partial<UserFormData>>({});
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const { data: securityRoles } = useQuery({
    queryKey: ["securityRoles"],
    queryFn: getSecurityRoles,
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  useEffect(() => {
    if (id) {
      getUser(id).then(user => {
        setFormData({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          department: user.department || "",
          epf: user.epf,
          telephone: user.telephone || "",
          address: user.address || "",
          email: user.email,
          password: "",
          confirmPassword: "",
          // role: prefer role string, fallback to role_id
          role: user.role ?? (user.role_id ? String(user.role_id) : ""),
          // status: prefer status string, fallback to inactive boolean
          status:
            user.status ??
            (typeof user.inactive === "boolean"
              ? user.inactive
                ? "inactive"
                : "active"
              : ""),
        });
      });
    }
  }, [id]);


  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validate = () => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.id) newErrors.id = "ID is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.epf) newErrors.epf = "EPF is required";
    if (!formData.telephone) newErrors.telephone = "Telephone is required";
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (formData.password || formData.confirmPassword) {
      const passwordError = validatePassword(formData.password, { required: true });
      if (passwordError) newErrors.password = passwordError;

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm the new password";
      } else if (formData.confirmPassword !== formData.password) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.status) newErrors.status = "Status is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      try {
        const payload: Record<string, string> = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          department: formData.department,
          epf: formData.epf,
          telephone: formData.telephone,
          address: formData.address,
          email: formData.email,
          role: formData.role,
          status: formData.status,
        };

        if (formData.password) {
          payload.password = formData.password;
        }

        if (!formData.id) {
          // alert("User ID is required to update.");
          return;
        }

        const updatedUser = await updateUser(formData.id, payload);
        console.log("User updated:", updatedUser);
        setOpen(true);
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.refetchQueries({ queryKey: ["users"] });
      } catch (err: any) {
        console.error("Error updating user:", err);
        setErrorMessage(
          err?.response?.data?.message ||
          "Failed to update user Please try again."
        );
        setErrorOpen(true);
      }
    }
  };

  return (
    <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
      <Paper
        sx={{
          p: theme.spacing(3),
          maxWidth: "600px",
          width: "100%",
          boxShadow: 2,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, textAlign: isMobile ? "center" : "left" }}>
          User Setup
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="ID"
            name="id"
            size="small"
            fullWidth
            value={formData.id}
            onChange={handleInputChange}
            error={!!errors.id}
            helperText={errors.id}
          />

          <TextField
            label="First Name"
            name="firstName"
            size="small"
            fullWidth
            value={formData.firstName}
            onChange={handleInputChange}
            error={!!errors.firstName}
            helperText={errors.firstName}
          />

          <TextField
            label="Last Name"
            name="lastName"
            size="small"
            fullWidth
            value={formData.lastName}
            onChange={handleInputChange}
            error={!!errors.lastName}
            helperText={errors.lastName}
          />

          <TextField
            label="Department"
            name="department"
            size="small"
            fullWidth
            value={formData.department}
            onChange={handleInputChange}
            error={!!errors.department}
            helperText={errors.department}
          />

          <TextField
            label="EPF"
            name="epf"
            size="small"
            fullWidth
            value={formData.epf}
            onChange={handleInputChange}
            error={!!errors.epf}
            helperText={errors.epf}
          />

          <TextField
            label="Telephone Number"
            name="telephone"
            size="small"
            fullWidth
            value={formData.telephone}
            onChange={handleInputChange}
            error={!!errors.telephone}
            helperText={errors.telephone}
          />

          <TextField
            label="Address"
            name="address"
            size="small"
            fullWidth
            value={formData.address}
            onChange={handleInputChange}
            error={!!errors.address}
            helperText={errors.address}
          />

          <TextField
            label="Email"
            name="email"
            size="small"
            fullWidth
            value={formData.email}
            onChange={handleInputChange}
            error={!!errors.email}
            helperText={errors.email}
          />

          <UserPasswordFields
            password={formData.password}
            confirmPassword={formData.confirmPassword}
            onPasswordChange={(value) =>
              setFormData((prev) => ({ ...prev, password: value }))
            }
            onConfirmPasswordChange={(value) =>
              setFormData((prev) => ({ ...prev, confirmPassword: value }))
            }
            passwordError={errors.password}
            confirmPasswordError={errors.confirmPassword}
            required={false}
            hasExistingPassword
            optionalHint="Leave new password blank to keep the current one. Enter a new password only if you want to change it."
          />

          <FormControl size="small" fullWidth error={!!errors.role}>
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              onChange={handleSelectChange}
              label="Role"
            >
              {(securityRoles || []).map((r: any) => (
                <MenuItem key={r.id} value={r.role}>
                  {r.role}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.role}</FormHelperText>
          </FormControl>

          <FormControl size="small" fullWidth error={!!errors.status}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleSelectChange}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
            <FormHelperText>{errors.status}</FormHelperText>
          </FormControl>
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 2 : 0, }}>
          <Button onClick={() => window.history.back()}>Back</Button>

          <Button
            variant="contained"
            fullWidth={isMobile}
            sx={{ backgroundColor: "var(--pallet-blue)" }}
            onClick={handleSubmit}
          >
            Update
          </Button>
        </Box>
      </Paper>
      <UpdateConfirmationModal
        open={open}
        title="Success"
        content={
          formData.password
            ? "Password updated successfully. The user must sign in again with the new password."
            : "User has been updated successfully!"
        }
        handleClose={() => setOpen(false)}
        onSuccess={() => window.history.back()}
      />
      <ErrorModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        message={errorMessage}
      />
    </Stack>
  );
}