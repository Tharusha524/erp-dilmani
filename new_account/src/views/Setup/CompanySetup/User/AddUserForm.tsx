import React, { useState } from "react";
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
import { createUser } from "../../../../api/UserManagement/userManagement";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getSecurityRoles } from "../../../../api/AccessSetup/AccessSetupApi";
import { useNavigate } from "react-router";
import AddedConfirmationModal from "../../../../components/AddedConfirmationModal";
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
   image: File | null;
}

export default function AddUserForm() {
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
    image:null,
  });

  const [errors, setErrors] = useState<Partial<UserFormData>>({});
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
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordError = validatePassword(formData.password, { required: true });
      if (passwordError) newErrors.password = passwordError;
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.status) newErrors.status = "Status is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async () => {
  if (validate()) {
    try {
      const payload = new FormData();

      payload.append("first_name", formData.firstName);
      payload.append("last_name", formData.lastName);
      payload.append("department", formData.department);
      payload.append("epf", formData.epf);
      payload.append("telephone", formData.telephone);
      payload.append("address", formData.address);
      payload.append("email", formData.email);
      payload.append("password", formData.password);
      payload.append("role", formData.role);
      payload.append("status", formData.status);

      if (formData.image) {
        payload.append("image", formData.image); // File object
      }

      // send as FormData
      const user = await createUser(payload);
      console.log("User created:", user);

      // Update the cached `users` list so the table shows the new user immediately
      try {
        const mapped = {
          id: (user as any).id,
          fullName: `${(user as any).first_name || ""} ${(user as any).last_name || ""}`.trim(),
          department: (user as any).department || "",
          email: (user as any).email || "",
          role: (user as any).role || "",
          status: (user as any).status || "",
        };

        queryClient.setQueryData(["users"], (old: any[] | undefined) => {
          // Append the new user to the end. If cache is empty, return single item.
          if (!old) return [mapped];
          // Avoid creating duplicates if the backend returned a cached list
          if (old.some((u) => u.id === mapped.id)) return old;
          return [...old, mapped];
        });

        // Also invalidate to ensure server/other clients sync
        queryClient.invalidateQueries({ queryKey: ["users"] });
      } catch (cacheErr) {
        // don't block on cache failures
        console.warn("Failed to update users cache:", cacheErr);
      }

      setOpen(true);
      setErrors({});
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || "Failed to add User. Please try again."
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
            required
          />

          <TextField
            type="file"
            name="image"
            size="small"
            fullWidth
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target.files && e.target.files[0]) {
                setFormData({
                  ...formData,
                  image: e.target.files[0], // store the file object
                });
              }
            }}
            helperText="Upload profile image"
            InputLabelProps={{ shrink: true }}
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
            Add New
          </Button>
        </Box>
      </Paper>
      <AddedConfirmationModal
        open={open}
        title="Success"
        content="User has been added successfully!"
        addFunc={async () => { }}
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