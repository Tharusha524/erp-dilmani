
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import companyLogo from "../../assets/Untitled design (27).png";

import CustomButton from "../../components/CustomButton";
import LoginIcon from "@mui/icons-material/Login";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { createUser } from "../../api/UserManagement/userManagement";

// API Imports
import { fetchDepartmentData } from "../../api/departmentApi";
import { fetchFactoryData } from "../../api/factoryApi";
import { fetchJobPositionData } from "../../api/jobPositionApi";
import { getOrganization } from "../../api/OrganizationSettings/organizationSettingsApi";
import { resolveLogoSrc } from "../../utils/logoUrl";

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

  const { data: organizationData } = useQuery({
    queryKey: ["organization"],
    queryFn: getOrganization,
  });

  const logoSrc = organizationData && organizationData.logoUrl && organizationData.logoUrl.length > 0
    ? resolveLogoSrc(organizationData.logoUrl[0])
    : companyLogo;

  const orgName = organizationData?.organizationName?.trim() || "Grow Ledger";

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

  const handleDepartmentChange = (e: SelectChangeEvent<string>) => {
    setFormData({ ...formData, department: e.target.value });
  };

  const validate = () => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.epf) newErrors.epf = "Employee Number is required";
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <img
          src={logoSrc}
          alt="logo"
          height={"65px"}
          style={{ objectFit: 'contain' }}
          onError={(e) => { e.currentTarget.src = companyLogo; }}
        />
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--pallet-blue)', letterSpacing: '-0.05em' }}>
          {orgName}
        </Typography>
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
        <FormControl size="small" fullWidth error={!!errors.department}>
          <InputLabel>Department</InputLabel>
          <Select
            value={formData.department}
            onChange={handleDepartmentChange}
            label="Department"
          >
            {(departments || [])
              .filter((d: any) => !d.inactive)
              .map((d: any) => (
                <MenuItem key={d.id} value={d.department}>
                  {d.department}
                </MenuItem>
              ))}
          </Select>
          {errors.department && <FormHelperText>{errors.department}</FormHelperText>}
        </FormControl>
        <TextField
          label="Employee Number"
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
