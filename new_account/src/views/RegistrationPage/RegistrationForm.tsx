import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import companyLogo from "../../assets/company-logo.jpg";
import groupLogo from "../../assets/group-logo.png";
import CustomButton from "../../components/CustomButton";
import LoginIcon from "@mui/icons-material/Login";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { createUser } from "../../api/UserManagement/userManagement";
import { getSecurityRoles } from "../../api/AccessSetup/AccessSetupApi";

// API Imports
import { fetchDepartmentData } from "../../api/departmentApi";
import { fetchFactoryData } from "../../api/factoryApi";
import { fetchJobPositionData } from "../../api/jobPositionApi";

interface UserFormData {
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
  jobPosition?: string;
  assignedFactory?: any[];
  employeeNumber?: string;
}

function RegistrationForm() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up(990));
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: securityRoles } = useQuery({
    queryKey: ["securityRoles"],
    queryFn: getSecurityRoles,
  });
  const statusOptions = ["active", "inactive"];

  const [formData, setFormData] = useState<UserFormData>({
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
    jobPosition: "",
    assignedFactory: [],
    employeeNumber: "",
  });

  const [errors, setErrors] = useState<Partial<UserFormData>>({});
  const [showPassword, setShowPassword] = useState(false);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartmentData,
  });

  const { data: factories } = useQuery({
    queryKey: ["factories"],
    queryFn: fetchFactoryData,
  });

  const { data: jobPositions } = useQuery({
    queryKey: ["jobPositions"],
    queryFn: fetchJobPositionData,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.epf) newErrors.epf = "EPF is required";
    if (!formData.telephone) newErrors.telephone = "Telephone is required";
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.status) newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const registrationMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      enqueueSnackbar("User created successfully!", { variant: "success" });
      navigate("/dashboard");
    },
    onError: (err: any) => {
      enqueueSnackbar("Error creating user: " + JSON.stringify(err), {
        variant: "error",
      });
    },
  });

  const handleSubmit = () => {
    if (validate()) {
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        department: formData.department,
        epf: formData.epf,
        telephone: formData.telephone,
        address: formData.address,
        email: formData.email,
        password: formData.password,
        role_id: formData.role,
        status: formData.status,
        job_position: formData.jobPosition,
        assigned_factory: formData.assignedFactory,
        employee_number: formData.employeeNumber,
      };
      registrationMutation.mutate(payload);
    }
  };

  return (
    <Stack
      spacing={2}
      sx={{
        justifyContent: "center",
        margin: "2.5rem",
        marginBottom: isMdUp ? "2.5rem" : "22vh",
      }}
    >
      <Box>
        <img src={companyLogo} alt="logo" height={"65px"} />
        <img
          src={groupLogo}
          alt="logo"
          style={{ marginLeft: "1rem" }}
          height={"45px"}
        />
      </Box>
      <Box>
        <Typography variant={"body2"}>
          Create an account to access the platform
        </Typography>
      </Box>

      <Stack spacing={2}>
        {/* TextFields */}
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
        <TextField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          size="small"
          fullWidth
          value={formData.password}
          onChange={handleInputChange}
          error={!!errors.password}
          helperText={errors.password}
        />
        <TextField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          size="small"
          fullWidth
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              size="small"
            />
          }
          label="Show Password"
        />

        {/* Role & Status */}
        <FormControl fullWidth size="small" error={!!errors.role}>
          <InputLabel>Role</InputLabel>
          <Select
            name="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            label="Role"
          >
            {(securityRoles || []).map((r: any) => (
              <MenuItem key={r.id} value={String(r.id)}>
                {r.role}
              </MenuItem>
            ))}
          </Select>
          {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth size="small" error={!!errors.status}>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            label="Status"
          >
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
          {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
        </FormControl>


        {/* Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 3,
          }}
        >
          <CustomButton
            variant="contained"
            onClick={handleSubmit}
            startIcon={<LoginIcon />}
          >
            Create Account
          </CustomButton>
          <CustomButton
            variant="text"
            onClick={() => navigate("/")}
            sx={{ color: "var(--pallet-orange)" }}
          >
            Login to an existing account
          </CustomButton>
        </Box>
      </Stack>
    </Stack>
  );
}

export default RegistrationForm;
