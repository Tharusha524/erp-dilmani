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
import { useNavigate, useLocation } from "react-router";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";

// Import your form/table components
import GeneralSettingsForm from "./GeneralSettingsForm/GeneralSettingsForm";
import UpdateGeneralSettingsForm from "./GeneralSettingsForm/UpdateGeneralSettingsForm";
import CustomersContactsTable from "./Contacts/CustomersContactsTable";
import TransactionsTable from "./Transactions/TransactionsTable";
import SalesOrdersTable from "./SalesOrders/SalesOrdersTable";
import AttachmentsTable from "./Attachments/AttachmentsTable";

// TabPanel helper
function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ mt: 2 }}>{children}</Box>}</div>;
}

const AddAndManageCustomers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);

  // Customer dropdown state
  const [customers, setCustomers] = useState<{ debtor_no: string | number; name: string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | number>("new"); // default 'new'

  // Fetch customers from database
  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Keep selected customer in sync with URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const customerParam = params.get("customer");
    const tabParam = params.get("tab");

    if (!customerParam) {
      setSelectedCustomer("new");
    } else {
      const numeric = /^\d+$/.test(customerParam);
      setSelectedCustomer(numeric ? Number(customerParam) : customerParam);
    }

    if (tabParam) {
      const t = parseInt(tabParam, 10);
      if (!isNaN(t)) setTabValue(t);
    }
  }, [location.search]);

  const handleCustomerDeleted = () => {
    setSelectedCustomer("new");
    setTabValue(0);
    fetchCustomers();
    navigate(location.pathname, { replace: true });
  };

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);

    // persist tab in URL so it survives refresh
    try {
      const params = new URLSearchParams(location.search);
      params.set("tab", String(newValue));
      // keep customer param as-is (if present)
      const qs = params.toString();
      if (qs) navigate(`${location.pathname}?${qs}`, { replace: true });
      else navigate(location.pathname, { replace: true });
    } catch (err) {
      // ignore
    }
  };

  // Customer select handler
  const handleCustomerChange = (value: string | number) => {
    setSelectedCustomer(value);

    try {
      const params = new URLSearchParams(location.search);
      if (value === "new") {
        // remove customer and reset tab
        params.delete("customer");
        params.set("tab", "0");
        const qs = params.toString();
        if (qs) navigate(`${location.pathname}?${qs}`, { replace: true });
        else navigate(location.pathname, { replace: true });
        setTabValue(0);
      } else {
        params.set("customer", String(value));
        params.set("tab", String(tabValue));
        const qs = params.toString();
        navigate(`${location.pathname}?${qs}`, { replace: true });
      }
    } catch (err) {
      // ignore
    }

    // only switch to General Settings when creating a new customer
    if (value === "new") setTabValue(0);
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
          Manage Customer
        </Typography>

        {/* Customer dropdown */}
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Select Customer</InputLabel>
          <Select
            value={selectedCustomer}
            label="Select Customer"
            onChange={(e) => handleCustomerChange(e.target.value)}
          >
            <MenuItem value="new" key="new">
              + Add New Customer
            </MenuItem>
            {customers.map((customer) => (
              <MenuItem key={customer.debtor_no} value={customer.debtor_no}>
                {customer.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Back Button */}
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/sales/maintenance")}>
          Back
        </Button>
      </Box>

      {/* Tabs */}
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
        <Tab label="Contacts" disabled={selectedCustomer === "new"} />
        <Tab label="Transactions" disabled={selectedCustomer === "new"} />
        <Tab label="Sales Orders" disabled={selectedCustomer === "new"} />
        <Tab label="Attachments" disabled={selectedCustomer === "new"} />
      </Tabs>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {selectedCustomer === "new" ? (
          <GeneralSettingsForm onCustomerAdded={(newCust) => {
            setCustomers(prev => [...prev, newCust]);
            setSelectedCustomer(newCust.debtor_no);
          }} />
        ) : (
          <UpdateGeneralSettingsForm
            customerId={selectedCustomer}
            onCustomerDeleted={handleCustomerDeleted}
          />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {selectedCustomer !== "new" && <CustomersContactsTable customerId={selectedCustomer} />}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {selectedCustomer !== "new" && <TransactionsTable customerId={selectedCustomer} />}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {selectedCustomer !== "new" && <SalesOrdersTable customerId={selectedCustomer} />}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {selectedCustomer !== "new" && <AttachmentsTable customerId={selectedCustomer} />}
      </TabPanel>
    </Stack>
  );
};

export default AddAndManageCustomers;
