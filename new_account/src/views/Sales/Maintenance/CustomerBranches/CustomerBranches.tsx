import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
// Import your branch-specific components
import CustomerBranchesTable from "./GeneralSettings/CustomerBranchesTable";
import ContactsTable from "./Contacts/ContactsTable";
import UpdateCustomerBranchesGeneralSettingForm from "./GeneralSettings/UpdateCustomerBranchesGeneralSettingForm";
// TabPanel helper
function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ mt: 2 }}>{children}</Box>}</div>;
}

const CustomersBranches = () => {
  const navigate = useNavigate();
  const { branchCode } = useParams<{ branchCode: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  // Customer dropdown state
  const [customers, setCustomers] = useState<{ debtor_no: string | number; name: string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | number>("new"); // default 'new'

  // Check if we're in edit mode based on URL params
  useEffect(() => {
    if (branchCode) {
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  }, [branchCode]);

  // Fetch customers from database
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);

        // Set first customer as default
        if (data.length > 0) {
          setSelectedCustomer(data[0].debtor_no);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchCustomers();
  }, []);

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Customer select handler
  const handleCustomerChange = (value: string | number) => {
    setSelectedCustomer(value);
    setTabValue(0); // always switch to General Settings tab
    setIsEditMode(false); // reset edit mode when changing customer
  };

  return (
    <Stack sx={{ minHeight: "100vh", backgroundColor: "#f0f0f0", p: { xs: 2, sm: 3, md: 5 } }} spacing={3}>
      {/* Header + Dropdown + Back */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          Customer Branches
        </Typography>

        {!isEditMode && (
          /* Customer dropdown - hide in edit mode */
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Select Customer</InputLabel>
            <Select
              value={selectedCustomer}
              label="Select Customer"
              onChange={(e) => handleCustomerChange(e.target.value)}
            >
              {customers.map((customer) => (
                <MenuItem key={customer.debtor_no} value={customer.debtor_no}>
                  {customer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Back Button */}
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => {
            if (isEditMode) {
              setIsEditMode(false);
              navigate("/sales/maintenance/customer-branches");
            } else {
              navigate("/sales/maintenance");
            }
          }}
        >
          Back
        </Button>
      </Box>

      {/* Show the table directly when not in edit mode */}
      {!isEditMode ? (
        selectedCustomer && <CustomerBranchesTable customerId={selectedCustomer} />
      ) : (
        <>
          {/* Show tabs only in edit mode */}
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            textColor="primary"
            indicatorColor="primary"
            sx={{ backgroundColor: "#fff", borderRadius: 1 }}
          >
            <Tab label="General Settings" />
            <Tab label="Contacts" />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            {branchCode && (
              <UpdateCustomerBranchesGeneralSettingForm />
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {branchCode && (
              <ContactsTable customerId={branchCode} />
            )}
          </TabPanel>
        </>
      )}
    </Stack>
  );
};

export default CustomersBranches;
