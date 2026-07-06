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
  Checkbox,
  FormGroup,
  FormControlLabel,
  FormHelperText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import theme from "../../../../theme";
import {
  createSecurityRole,
  getSecurityRoles,
  getSecurityRole,
  updateSecurityRole,
  deleteSecurityRole,
} from "../../../../api/AccessSetup/AccessSetupApi";
import { useEffect } from "react";

const permissionList = [
  "Company Setup",
  "Special Maintenance",
  "Sales Configuration",
  "Sales Transactions",
  "Sales Related Reports",
  "Purchase Configuration",
  "Purchase Transactions",
  "Purchase Analytics",
  "Inventory Configuration",
  "Inventory Operations",
  "Inventory Analytics",
  "Fixed Assets Configuration",
  "Fixed Assets Operations",
  "Fixed Assets Analytics",
  "Manufacturing Configuration",
  "Manufacturing Transactions",
  "Manufacturing Analytics",
  "Dimensions Configuration",
  "Dimensions",
  "Banking & GL Configuration",
  "Banking & GL Transactions",
  "Banking & GL Analytics",
];



const companySetupNested = [
  "Company parameters",
  "Access levels edition",
  "Users setup",
  "Point of Sale definitions",
  "Printers configuration",
  "Print profiles",
  "Payment terms",
  "Shipping ways",
  "Credit status definitions changes",
  "Inventory locations changes",
  "Inventory movement types",
  "Manufacture work centres",
  "Forms setup",
  "Contact categories"
];

const specialMaintenanceNested = [
  "Voiding transactions",	
  "Database backup/restore",
  "Common view/print transactions interface",	
  "Attaching documents",
  "Display preferences",
  "Password changes",
  "Edit other users transactions"
];

const salesConfigurationNested = [
  "Sales types",
  "Sales prices edition",
  "Sales staff maintenance",
  "Sales areas maintenance",
  "Sales groups changes",
  "Sales templates",
  "Recurrent invoices definitions"
];

const salesTransactionsNested = [
  "Sales transactions view",
  "Sales customer and branches changes",
  "Sales quotations",
  "Sales orders edition",
  "Sales deliveries edition",
  "Sales invoices edition",
  "Sales credit notes against invoice",
  "Sales freehand credit notes",
  "Customer payments entry",
  "Customer payments allocation"
];

const salesReportsNested = [
  "Sales analytical reports",
  "Sales document bulk reports",
  "Sales prices listing",
  "Sales staff listing",
  "Customer bulk listing",
  "Customer status report",
  "Customer payments report"
];

const purchaseConfigurationNested = [
  "Purchase price changes",
];

const purchaseTransactionsNested = [
  "Supplier transactions view",
  "Suppliers changes",
  "Purchase order entry",
  "Purchase receive",
  "Supplier invoices",
  "Deleting GRN items during invoice entry",
  "Supplier credit notes",
  "Supplier payments",
  "Supplier payments allocations"
];

const purchaseAnalyticsNested = [
  "Supplier analytical reports",
  "Supplier document bulk reports",
  "Supplier payments report"
];

const inventoryConfigurationNested = [
  "Stock items add/edit",
  "Sales kits",
  "Item categories",
  "Units of measure"
];

const inventoryOperationsNested = [
  "Stock status view",
  "Stock transactions view",
  "Foreign item codes entry",
  "Inventory location transfers",
  "Inventory adjustments"
];

const inventoryAnalyticsNested = [
  "Reorder levels",
  "Items analytical reports and inquiries",
  "Inventory valuation report"
];

const fixedAssetsConfigurationNested = [
  "Fixed Asset items add/edit",
  "Fixed Asset categories",
  "Fixed Asset classes"
];

const fixedAssetsOperationsNested = [
  "Fixed Asset transactions view",
  "Fixed Asset location transfers",
  "Fixed Asset disposals",
  "Depreciation"
];

const fixedAssetsAnalyticsNested = [
  "Fixed Asset analytical reports and inquiries"
];

const manufacturingConfigurationNested = [
  "Bill of Materials",
];

const manufacturingTransactionsNested = [
  "Manufacturing operations view",
  "Work order entry",
  "Material issues entry",
  "Final product receive",
  "Work order releases"
];

const manufacturingAnalyticsNested = [
  "Work order analytical reports and inquiries",
  "Manufacturing cost inquiry",
  "Work order bulk reports",
  "Bill of materials reports"
];

const dimensionsConfigurationNested = [
  "Dimension tags"
];

const dimensionsNested = [
  "Dimension view",
  "Dimension entry",
  "Dimension reports"
];

const bankingGLConfigurationNested = [
  "Item tax type definitions",
  "GL accounts edition",
  "GL account groups",
  "GL account classes",
  "Quick GL entry definitions",
  "Currencies",
  "Bank accounts",
  "Tax rates",
  "Tax groups",
  "Fiscal years maintenance",
  "Company GL setup",
  "GL Account tags",
  "Closing GL transactions",
  "Allow entry on non closed Fiscal years"
];

const bankingGLTransactionsNested = [
  "Bank transactions view",
  "GL postings view",
  "Exchange rate table changes",
  "Bank payments",
  "Bank deposits",
  "Bank account transfers",
  "Bank reconciliation",
  "Manual journal entries",
  "Journal entries to bank related accounts",
  "Budget edition",
  "Item standard costs",
  "Revenue / Cost Accruals"
];

const bankingGLAnalyticsNested = [
  "GL analytical reports and inquiries",
  "Tax reports and inquiries",
  "Bank reports and inquiries",
  "GL reports and inquiries"
]

// Permission -> ID mapping (complete, easy-to-follow)
// Pattern used:
// - Top-level sections: start at 1000 and increment by 10 (1000, 1010, ...)
// - Nested areas: assigned sequentially starting from parentID + 1
// Adjust IDs if your backend uses different values.
const PERMISSION_ID_MAP: Record<string, number> = {
  // top-level sections (parents)
  "System Administration": 1000,
  "Company Setup": 1100,
  "Special Maintenance": 1200,
  "Sales Configuration": 1300,
  "Sales Transactions": 1400,
  "Sales Related Reports": 1500,
  "Purchase Configuration": 1600,
  "Purchase Transactions": 1700,
  "Purchase Analytics": 1800,
  "Inventory Configuration": 1900,
  "Inventory Operations": 2000,
  "Inventory Analytics": 2100,
  "Fixed Assets Configuration": 2200,
  "Fixed Assets Operations": 2300,
  "Fixed Assets Analytics": 2400,
  "Manufacturing Configuration": 2500,
  "Manufacturing Transactions": 2600,
  "Manufacturing Analytics": 2700,
  "Dimensions Configuration": 2800,
  "Dimensions": 2900,
  "Banking & GL Configuration": 3000,
  "Banking & GL Transactions": 3100,
  "Banking & GL Analytics": 3200,

  // Company Setup nested
  "Company parameters": 1101,
  "Access levels edition": 1102,
  "Users setup": 1103,
  "Point of Sale definitions": 1104,
  "Printers configuration": 1105,
  "Print profiles": 1106,
  "Payment terms": 1107,
  "Shipping ways": 1108,
  "Credit status definitions changes": 1109,
  "Inventory locations changes": 1110,
  "Inventory movement types": 1111,
  "Manufacture work centres": 1112,
  "Forms setup": 1113,
  "Contact categories": 1114,

  // Special Maintenance nested
  "Voiding transactions": 1201,
  "Database backup/restore": 1202,
  "Common view/print transactions interface": 1203,
  "Attaching documents": 1204,
  "Display preferences": 1205,
  "Password changes": 1206,
  "Edit other users transactions": 1207,

  // Sales Configuration nested
  "Sales types": 1301,
  "Sales prices edition": 1302,
  "Sales staff maintenance": 1303,
  "Sales areas maintenance": 1304,
  "Sales groups changes": 1305,
  "Sales templates": 1306,
  "Recurrent invoices definitions": 1307,

  // Sales Transactions nested
  "Sales transactions view": 1401,
  "Sales customer and branches changes": 1402,
  "Sales quotations": 1403,
  "Sales orders edition": 1404,
  "Sales deliveries edition": 1405,
  "Sales invoices edition": 1406,
  "Sales credit notes against invoice": 1407,
  "Sales freehand credit notes": 1408,
  "Customer payments entry": 1409,
  "Customer payments allocation": 1410,

  // Sales Related Reports nested
  "Sales analytical reports": 1501,
  "Sales document bulk reports": 1502,
  "Sales prices listing": 1503,
  "Sales staff listing": 1504,
  "Customer bulk listing": 1505,
  "Customer status report": 1506,
  "Customer payments report": 1507,

  // Purchase Configuration nested
  "Purchase price changes": 1601,

  // Purchase Transactions nested
  "Supplier transactions view": 1701,
  "Suppliers changes": 1702,
  "Purchase order entry": 1703,
  "Purchase receive": 1704,
  "Supplier invoices": 1705,
  "Deleting GRN items during invoice entry": 1706,
  "Supplier credit notes": 1707,
  "Supplier payments": 1708,
  "Supplier payments allocations": 1709,

  // Purchase Analytics nested
  "Supplier analytical reports": 1801,
  "Supplier document bulk reports": 1802,
  "Supplier payments report": 1803,

  // Inventory Configuration nested
  "Stock items add/edit": 1901,
  "Sales kits": 1902,
  "Item categories": 1903,
  "Units of measure": 1904,

  // Inventory Operations nested
  "Stock status view": 2001,
  "Stock transactions view": 2002,
  "Foreign item codes entry": 2003,
  "Inventory location transfers": 2004,
  "Inventory adjustments": 2005,

  // Inventory Analytics nested
  "Reorder levels": 2101,
  "Items analytical reports and inquiries": 2102,
  "Inventory valuation report": 2103,

  // Fixed Assets Configuration nested
  "Fixed Asset items add/edit": 2201,
  "Fixed Asset categories": 2202,
  "Fixed Asset classes": 2203,

  // Fixed Assets Operations nested
  "Fixed Asset transactions view": 2301,
  "Fixed Asset location transfers": 2302,
  "Fixed Asset disposals": 2303,
  "Depreciation": 2304,

  // Fixed Assets Analytics nested
  "Fixed Asset analytical reports and inquiries": 2401,

  // Manufacturing Configuration nested
  "Bill of Materials": 2501,

  // Manufacturing Transactions nested
  "Manufacturing operations view": 2601,
  "Work order entry": 2602,
  "Material issues entry": 2603,
  "Final product receive": 2604,
  "Work order releases": 2605,

  // Manufacturing Analytics nested
  "Work order analytical reports and inquiries": 2701,
  "Manufacturing cost inquiry": 2702,
  "Work order bulk reports": 2703,
  "Bill of materials reports": 2704,

  // Dimensions Configuration nested
  "Dimension tags": 2801,

  // Dimensions nested
  "Dimension view": 2901,
  "Dimension entry": 2902,
  "Dimension reports": 2903,

  // Banking & GL Configuration nested
  "Item tax type definitions": 3001,
  "GL accounts edition": 3002,
  "GL account groups": 3003,
  "GL account classes": 3004,
  "Quick GL entry definitions": 3005,
  "Currencies": 3006,
  "Bank accounts": 3007,
  "Tax rates": 3008,
  "Tax groups": 3009,
  "Fiscal years maintenance": 3010,
  "Company GL setup": 3011,
  "GL Account tags": 3012,
  "Closing GL transactions": 3013,
  "Allow entry on non closed Fiscal years": 3014,

  // Banking & GL Transactions nested
  "Bank transactions view": 3101,
  "GL postings view": 3102,
  "Exchange rate table changes": 3103,
  "Bank payments": 3104,
  "Bank deposits": 3105,
  "Bank account transfers": 3106,
  "Bank reconciliation": 3107,
  "Manual journal entries": 3108,
  "Journal entries to bank related accounts": 3109,
  "Budget edition": 3110,
  "Item standard costs": 3111,
  "Revenue / Cost Accruals": 3112,

  // Banking & GL Analytics nested
  "GL analytical reports and inquiries": 3201,
  "Tax reports and inquiries": 3202,
  "Bank reports and inquiries": 3203,
  "GL reports and inquiries": 3204,
};

interface UserAccessFormData {
  selectedRole: string;
  roleName: string;
  roleDescription: string;
  status: string;
  permissions: string[];
}

export default function AddUserAccessForm() {
  const [formData, setFormData] = useState<UserAccessFormData>({
    selectedRole: "__new",
    roleName: "",
    roleDescription: "",
    status: "",
    permissions: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserAccessFormData, string>>>({});

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [availableRoles, setAvailableRoles] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [isNewMode, setIsNewMode] = useState(true);

  useEffect(() => {
    // load available roles
    const load = async () => {
      try {
        const data = await getSecurityRoles();
        setAvailableRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load roles", err);
      }
    };

    load();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const { name, value } = e.target;
    // if selecting role
    if (name === "selectedRole") {
      // user picked 'Add New Role'
      if (value === "__new") {
        setIsNewMode(true);
        setFormData({
          selectedRole: "",
          roleName: "",
          roleDescription: "",
          status: "",
          permissions: [],
        });
        return;
      }

      // user picked an existing role
      if (value) {
        const selected = availableRoles.find((r) => String(r.id) === String(value));
        if (selected) {
          setIsNewMode(false);
        // build permission names from sections and areas (reverse map)
        const perms: string[] = [];

        const sectionsStr: string | null = selected.sections || selected.sections === "" ? selected.sections : null;
        const areasStr: string | null = selected.areas || selected.areas === "" ? selected.areas : null;

        const reverseMap: Record<number, string> = {};
        Object.keys(PERMISSION_ID_MAP).forEach((k) => {
          reverseMap[PERMISSION_ID_MAP[k]] = k;
        });

        if (sectionsStr) {
          sectionsStr.split(";").forEach((s: string) => {
            const id = Number(s);
            if (reverseMap[id]) perms.push(reverseMap[id]);
          });
        }
        if (areasStr) {
          areasStr.split(";").forEach((a: string) => {
            const id = Number(a);
            if (reverseMap[id]) perms.push(reverseMap[id]);
          });
        }

          setFormData((prev) => ({
            ...prev,
            selectedRole: String(selected.id),
            roleName: selected.role || prev.roleName,
            roleDescription: selected.description || prev.roleDescription,
            status: selected.inactive ? "inactive" : "active",
            permissions: perms,
          }));
          return;
        }
      }
      // if value is empty or not found we'll fallthrough to set raw value below
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePermissionChange = (permission: string) => {
    setFormData((prev) => {
      const newPermissions = prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission];

      return { ...prev, permissions: newPermissions };
    });
  };

  const handleNestedPermissionChange = (nestedPermission: string) => {
    setFormData((prev) => {
      const newPermissions = prev.permissions.includes(nestedPermission)
        ? prev.permissions.filter((p) => p !== nestedPermission)
        : [...prev.permissions, nestedPermission];
      return { ...prev, permissions: newPermissions };
    });
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserAccessFormData, string>> = {};

    if (!formData.roleName) newErrors.roleName = "Role Name is required";
    if (!formData.roleDescription)
      newErrors.roleDescription = "Role Description is required";
    if (!formData.status) newErrors.status = "Status is required";
    if (!formData.permissions || formData.permissions.length === 0)
      newErrors.permissions = "At least one permission must be selected";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      setLoading(true);
      // Build sections (top-level permission ids) and areas (nested ids)
      const selectedSections = new Set<number>();
      const selectedAreas = new Set<number>();

      formData.permissions.forEach((perm) => {
        const id = PERMISSION_ID_MAP[perm];
        if (id) {
          // decide if this perm is a top-level section or nested area by checking whether
          // the value exists among top-level permissionList
          if (permissionList.includes(perm)) selectedSections.add(id);
          else selectedAreas.add(id);
        }
      });

      // Convert sets to semicolon-separated strings. Order doesn't matter but we'll preserve insertion order
      const sectionsStr = Array.from(selectedSections).join(";");
      const areasStr = Array.from(selectedAreas).join(";");

      const payload = {
        role: formData.roleName,
        description: formData.roleDescription,
        sections: sectionsStr || null,
        areas: areasStr || null,
        inactive: formData.status !== "active",
      };

      const doCreate = async () => {
        try {
          const res = await createSecurityRole(payload);
          console.log("Created role:", res);
          alert("Role created successfully");
          // reset form
          setFormData({
            selectedRole: "",
            roleName: "",
            roleDescription: "",
            status: "",
            permissions: [],
          });
          // go back to new-role default
          setFormData({
            selectedRole: "__new",
            roleName: "",
            roleDescription: "",
            status: "",
            permissions: [],
          });
          setIsNewMode(true);
        } catch (err) {
          console.error("Create role error:", err);
          alert("Failed to create role. See console for details.");
        } finally {
          setLoading(false);
          // refresh roles
          try {
            const data = await getSecurityRoles();
            setAvailableRoles(Array.isArray(data) ? data : []);
          } catch (e) {
            console.error("Failed to refresh roles", e);
          }
        }
      };

      const doUpdate = async (id: string | number) => {
        try {
          const res = await updateSecurityRole(id, payload);
          console.log("Updated role:", res);
          alert("Role updated successfully");
              // reset form to new-role default
              setFormData({
                selectedRole: "__new",
                roleName: "",
                roleDescription: "",
                status: "",
                permissions: [],
              });
              setIsNewMode(true);
        } catch (err) {
          console.error("Update role error:", err);
          alert("Failed to update role. See console for details.");
        } finally {
          setLoading(false);
          // refresh roles
          try {
            const data = await getSecurityRoles();
            setAvailableRoles(Array.isArray(data) ? data : []);
          } catch (e) {
            console.error("Failed to refresh roles", e);
          }
        }
      };

      // if selectedRole is set, update; otherwise create
      if (isNewMode || !formData.selectedRole) {
        await doCreate();
      } else {
        await doUpdate(formData.selectedRole);
      }
    }
  };

  const handleDelete = async () => {
    if (!formData.selectedRole) return;
    if (!confirm("Are you sure you want to delete this role?")) return;
    setLoading(true);
    try {
      await deleteSecurityRole(formData.selectedRole);
      alert("Role deleted");
      // reset form and refresh
      setFormData({
        selectedRole: "__new",
        roleName: "",
        roleDescription: "",
        status: "",
        permissions: [],
      });
      setIsNewMode(true);
      const data = await getSecurityRoles();
      setAvailableRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Delete role error:", err);
      alert("Failed to delete role. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
      {/* Dropdown to select existing roles */}
      <Box sx={{ width: "100%", maxWidth: "600px", mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Select Role</InputLabel>
          <Select
            name="selectedRole"
            value={formData.selectedRole}
            onChange={handleChange}
            label="Select Role"
          >
            <MenuItem value="__new">+ Add New Role</MenuItem>
            {availableRoles.map((r) => (
              <MenuItem key={r.id} value={String(r.id)}>
                {r.role}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper
        sx={{
          p: theme.spacing(3),
          maxWidth: "600px",
          width: "100%",
          boxShadow: 2,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 3 }}>
          Role Setup
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Role Name"
            name="roleName"
            size="small"
            fullWidth
            value={formData.roleName}
            onChange={handleChange}
            error={!!errors.roleName}
            helperText={errors.roleName}
          />

          <TextField
            label="Role Description"
            name="roleDescription"
            size="small"
            fullWidth
            value={formData.roleDescription}
            onChange={handleChange}
            error={!!errors.roleDescription}
            helperText={errors.roleDescription}
          />

          <FormControl size="small" fullWidth error={!!errors.status}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
            {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
          </FormControl>

          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 600 }}
            >
              Permissions
            </Typography>
            <FormGroup>
              {permissionList.map((perm) => (
                <Box key={perm}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.permissions.includes(perm)}
                        onChange={() => handlePermissionChange(perm)}
                      />
                    }
                    label={perm}
                  />

                  

                  {perm === "Company Setup" &&
                    formData.permissions.includes("Company Setup") && (
                      <Box sx={{ pl: 4 }}>
                        {companySetupNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Special Maintenance" &&
                    formData.permissions.includes("Special Maintenance") && (
                      <Box sx={{ pl: 4 }}>
                        {specialMaintenanceNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Sales Configuration" &&
                    formData.permissions.includes("Sales Configuration") && (
                      <Box sx={{ pl: 4 }}>
                        {salesConfigurationNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Sales Transactions" &&
                    formData.permissions.includes("Sales Transactions") && (
                      <Box sx={{ pl: 4 }}>
                        {salesTransactionsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Sales Related Reports" &&
                    formData.permissions.includes("Sales Related Reports") && (
                      <Box sx={{ pl: 4 }}>
                        {salesReportsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Purchase Configuration" &&
                    formData.permissions.includes("Purchase Configuration") && (
                      <Box sx={{ pl: 4 }}>
                        {purchaseConfigurationNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Purchase Transactions" &&
                    formData.permissions.includes("Purchase Transactions") && (
                      <Box sx={{ pl: 4 }}>
                        {purchaseTransactionsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Purchase Analytics" &&
                    formData.permissions.includes("Purchase Analytics") && (
                      <Box sx={{ pl: 4 }}>
                        {purchaseAnalyticsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Inventory Configuration" &&
                    formData.permissions.includes("Inventory Configuration") && (
                      <Box sx={{ pl: 4 }}>
                        {inventoryConfigurationNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Inventory Operations" &&
                    formData.permissions.includes("Inventory Operations") && (
                      <Box sx={{ pl: 4 }}>
                        {inventoryOperationsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Inventory Analytics" &&
                    formData.permissions.includes("Inventory Analytics") && (
                      <Box sx={{ pl: 4 }}>
                        {inventoryAnalyticsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Fixed Assets Configuration" &&
                    formData.permissions.includes("Fixed Assets Configuration") && (
                      <Box sx={{ pl: 4 }}>
                        {fixedAssetsConfigurationNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Fixed Assets Operations" &&
                    formData.permissions.includes("Fixed Assets Operations") && (
                      <Box sx={{ pl: 4 }}>
                        {fixedAssetsOperationsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Fixed Assets Analytics" &&
                    formData.permissions.includes("Fixed Assets Analytics") && (
                      <Box sx={{ pl: 4 }}>
                        {fixedAssetsAnalyticsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Manufacturing Configuration" &&
                    formData.permissions.includes("Manufacturing Configuration") && (
                      <Box sx={{ pl: 4 }}>
                        {manufacturingConfigurationNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Manufacturing Transactions" &&
                    formData.permissions.includes("Manufacturing Transactions") && (
                      <Box sx={{ pl: 4 }}>
                        {manufacturingTransactionsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Manufacturing Analytics" &&
                    formData.permissions.includes("Manufacturing Analytics") && (
                      <Box sx={{ pl: 4 }}>
                        {manufacturingAnalyticsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Dimensions Configuration" &&
                    formData.permissions.includes("Dimensions Configuration") && (
                      <Box sx={{ pl: 4 }}>
                        {dimensionsConfigurationNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Dimensions" &&
                    formData.permissions.includes("Dimensions") && (
                      <Box sx={{ pl: 4 }}>
                        {dimensionsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Banking & GL Configuration" &&
                    formData.permissions.includes("Banking & GL Configuration") && (
                      <Box sx={{ pl: 4 }}>
                        {bankingGLConfigurationNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Banking & GL Transactions" &&
                    formData.permissions.includes("Banking & GL Transactions") && (
                      <Box sx={{ pl: 4 }}>
                        {bankingGLTransactionsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                  {perm === "Banking & GL Analytics" &&
                    formData.permissions.includes("Banking & GL Analytics") && (
                      <Box sx={{ pl: 4 }}>
                        {bankingGLAnalyticsNested.map((nested) => (
                          <FormControlLabel
                            key={nested}
                            control={
                              <Checkbox
                                checked={formData.permissions.includes(nested)}
                                onChange={() => handleNestedPermissionChange(nested)}
                              />
                            }
                            label={nested}
                          />
                        ))}
                      </Box>
                    )
                  }

                </Box>
              ))}
            </FormGroup>
            {errors.permissions && (
              <FormHelperText sx={{ color: "red" }}>
                {errors.permissions}
              </FormHelperText>
            )}
          </Box>
        </Stack>

        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            mt: 3,
            gap: isMobile ? 2 : 0,
          }}
        >
          <Button fullWidth={isMobile} onClick={() => window.history.back()} disabled={loading}>
            Back
          </Button>

          <Box sx={{ display: "flex", gap: 1, width: isMobile ? "100%" : "auto" }}>
            {formData.selectedRole && (
              <Button
                color="error"
                variant="outlined"
                disabled={loading}
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}

            <Button
              variant="contained"
              fullWidth={isMobile}
              sx={{ backgroundColor: "var(--pallet-blue)" }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {formData.selectedRole ? "Save" : "Insert New Role"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Stack>
  );
}
