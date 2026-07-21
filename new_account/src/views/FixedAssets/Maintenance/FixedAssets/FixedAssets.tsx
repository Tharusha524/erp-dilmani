import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router";
import { useLocation } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { getItems, getItemById } from "../../../../api/Item/ItemApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import ItemSearchSelect from "../../../../components/ItemSearchSelect";

import FixedAssetsGeneralSettingsForm from "./FixedAssetsGeneralSettings/FixedAssetsGeneralSettingsForm";
import UpdateFixedAssetsGeneralSettingsForm from "./FixedAssetsGeneralSettings/UpdateFixedAssetsGeneralSettingsForm";
import FixedAssetsTransactionsTable from "./Transactions/FixedAssetsTransactionsTable";
import FixedAssetsAttachmentsTable from "./Attachments/FixedAssetsAttachmentsTable";

// TabPanel helper
function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ mt: 2 }}>{children}</Box>}</div>;
}

const FixedAssets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(location.state?.tab || 0);

  // Item dropdown state
  const [selectedItem, setSelectedItem] = useState<string | number>(location.state?.selectedItem || "new");
  const [showInactive, setShowInactive] = useState(false);

  //Fetch items using React Query
  const { data: items = [] } = useQuery<{ stock_id: string | number; category_id: string | number; description: string; inactive: number }[]>({
    queryKey: ["items"],
    queryFn: () => getItems() as Promise<{ stock_id: string | number; category_id: string | number; description: string; inactive: number }[]>,
  });

 // Fetch categories using React Query
  const { data: categories = [] } = useQuery<{ category_id: number; description: string }[]>({
    queryKey: ["itemCategories"],
    queryFn: () => getItemCategories() as Promise<{ category_id: number; description: string }[]>,
  });

 // Fetch selected item data
  const { data: selectedItemData } = useQuery({
    queryKey: ["item", selectedItem],
    queryFn: () => getItemById(selectedItem),
    enabled: selectedItem !== "new",
  });

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Item select handler
  const handleItemChange = (value: string | number) => {
    setSelectedItem(value);
  };

  const faItems = useMemo(
    () =>
      (items || []).filter((it: { inactive?: number; mb_flag?: number }) => {
        const activeOk = showInactive ? true : !it.inactive;
        return activeOk && Number(it.mb_flag) === 4;
      }),
    [items, showInactive]
  );

  const faCategories = useMemo(
    () =>
      (categories || []).filter(
        (c) => Number((c as { dflt_mb_flag?: number }).dflt_mb_flag) === 4
      ),
    [categories]
  );

  return (
    <FormPageLayout>
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
          Manage Fixed Assets
        </Typography>

        {/* Item picker and checkbox */}
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          <Button
            variant={selectedItem === "new" ? "contained" : "outlined"}
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleItemChange("new")}
          >
            Add New
          </Button>
          <Box sx={{ minWidth: 280 }}>
            <ItemSearchSelect
              label="Select Fixed Asset"
              selectedStockId={selectedItem === "new" ? "" : String(selectedItem)}
              items={faItems as any[]}
              categories={faCategories.map((cat) => ({
                id: cat.category_id,
                category_name: cat.description,
              }))}
              includeInactive={showInactive}
              onSelect={(item) => {
                if (item) {
                  handleItemChange(item.stock_id);
                }
              }}
            />
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
            }
            label="Show Inactive"
          />
        </Stack>

        {/* Back Button */}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/fixedassets/maintenance")}
        >
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
        sx={{ bgcolor: "background.paper", borderRadius: 1 }}
      >
        <Tab label="General Settings" />
        <Tab label="Transactions" disabled={selectedItem === "new"} />
        <Tab label="Attachments" disabled={selectedItem === "new"} />
      </Tabs>
      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {selectedItem === "new" ? (
          <FixedAssetsGeneralSettingsForm/>
        ) : (
          <UpdateFixedAssetsGeneralSettingsForm itemId={selectedItem} />
        )}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {selectedItem !== "new" && <FixedAssetsTransactionsTable itemId={selectedItem} />}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {selectedItem !== "new" && <FixedAssetsAttachmentsTable itemId={selectedItem} />}
      </TabPanel>
    </FormPageLayout>
  );
};

export default FixedAssets;
