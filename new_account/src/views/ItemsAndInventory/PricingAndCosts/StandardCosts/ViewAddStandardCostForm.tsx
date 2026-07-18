import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  ListSubheader,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import theme from "../../../../theme";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import { getItemById, updateItem, getItems } from "../../../../api/Item/ItemApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { getItemTypes } from "../../../../api/ItemType/ItemType";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import UpdateConfirmationModal from "../../../../components/UpdateConfirmationModal";
import ErrorModal from "../../../../components/ErrorModal";
import FormattedNumberField from "../../../../components/FormattedNumberField";

interface ItemStandardCostProps {
  itemId?: string | number;
}

interface StandardCostFormData {
  unitCost: string;
  standardLabourCost: string;
  standardOverheadCost: string;
}

export default function ViewAddStandardCostForm({ itemId }: ItemStandardCostProps) {
  const [formData, setFormData] = useState<StandardCostFormData>({
    unitCost: "",
    standardLabourCost: "",
    standardOverheadCost: "",
  });

  const [errors, setErrors] = useState<Partial<StandardCostFormData>>({});
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [showInactive, setShowInactive] = useState(false);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: itemData, isLoading: itemLoading, isFetching: itemFetching } = useQuery({
    queryKey: ["item", selectedItem],
    queryFn: () => getItemById(selectedItem),
    enabled: !!selectedItem,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<
    { stock_id: string | number; category_id: string | number; description: string; inactive: number }[]
  >({
    queryKey: ["items"],
    queryFn: getItems,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<
    { category_id: number; description: string }[]
  >({
    queryKey: ["itemCategories"],
    queryFn: () => getItemCategories(),
  });

  const { data: itemTypes = [] } = useQuery({
    queryKey: ["itemTypes"],
    queryFn: getItemTypes,
  });

  const itemDataReady =
    !!selectedItem &&
    !!itemData &&
    String(itemData.stock_id) === String(selectedItem) &&
    !itemLoading &&
    !itemFetching;

  const selectedItemType = itemTypes.find((t) => t.id === itemData?.mb_flag);
  const isManufacture = selectedItemType?.name?.toLowerCase() === "manufactured";

  useEffect(() => {
    if (itemDataReady) {
      setFormData({
        unitCost: itemData.material_cost?.toString() || "",
        standardLabourCost: itemData.labour_cost?.toString() || "",
        standardOverheadCost: itemData.overhead_cost?.toString() || "",
      });
    }
  }, [itemDataReady, itemData]);

  useEffect(() => {
    if (itemId && items.length > 0 && !selectedItem) {
      setSelectedItem(itemId.toString());
    }
  }, [itemId, items, selectedItem]);

  const updateCostMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateItem(selectedItem, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item", selectedItem] });
      setOpen(true);
    },
    onError: (err: unknown) => {
      console.error("Failed to update standard cost:", err);
      setErrorMessage("Failed to update standard cost");
      setErrorOpen(true);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleItemChange = (event: SelectChangeEvent<string>) => {
    setSelectedItem(event.target.value);
    setFormData({
      unitCost: "",
      standardLabourCost: "",
      standardOverheadCost: "",
    });
  };

  const handleShowInactiveChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowInactive(event.target.checked);
  };

  const validate = () => {
    const newErrors: Partial<StandardCostFormData> = {};
    if (!formData.unitCost) newErrors.unitCost = "Unit Cost is required";
    if (isManufacture && !formData.standardLabourCost) {
      newErrors.standardLabourCost = "Standard Labour Cost is required";
    }
    if (isManufacture && !formData.standardOverheadCost) {
      newErrors.standardOverheadCost = "Standard Overhead Cost is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !itemDataReady || !itemData) {
      if (!itemDataReady) {
        setErrorMessage("Item data is still loading. Please wait and try again.");
        setErrorOpen(true);
      }
      return;
    }

    const payload = {
      ...itemData,
      material_cost: parseFloat(formData.unitCost) || 0,
      labour_cost: isManufacture ? (parseFloat(formData.standardLabourCost) || 0) : 0,
      overhead_cost: isManufacture ? (parseFloat(formData.standardOverheadCost) || 0) : 0,
    };
    updateCostMutation.mutate(payload);
  };

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Standard Costs" },
  ];

  if (itemsLoading || categoriesLoading) {
    return (
      <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
        <Typography>Loading...</Typography>
      </Stack>
    );
  }

  return (
    <FormPageLayout>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <PageTitle title="Standard Costs" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>
      </Box>
      <Stack alignItems="center" spacing={2}>
        <Paper
          sx={{
            p: theme.spacing(2),
            maxWidth: "500px",
            width: "100%",
            boxShadow: 2,
            borderRadius: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <FormControl sx={{ minWidth: 250 }} size="small">
              <InputLabel>Select Item</InputLabel>
              <Select
                value={selectedItem}
                onChange={handleItemChange}
                label="Select Item"
              >
                <MenuItem value="">
                  <em>Select an Item</em>
                </MenuItem>
                {(() => {
                  const filteredItems = items.filter((item) => showInactive || item.inactive !== 1);
                  return Object.entries(
                    filteredItems.reduce((groups, item) => {
                      const catId = item.category_id || "Uncategorized";
                      if (!groups[catId]) groups[catId] = [];
                      groups[catId].push(item);
                      return groups;
                    }, {} as Record<string, typeof filteredItems>)
                  ).map(([categoryId, groupedItems]) => {
                    const category = categories.find((cat) => cat.category_id === Number(categoryId));
                    const categoryLabel = category ? category.description : `Category ${categoryId}`;
                    return [
                      <ListSubheader key={`cat-${categoryId}`}>
                        {categoryLabel}
                      </ListSubheader>,
                      ...groupedItems
                        .sort((a, b) => a.description.localeCompare(b.description))
                        .map((item) => (
                          <MenuItem key={item.stock_id} value={item.stock_id.toString()}>
                            {item.description} {item.inactive === 1 ? "(Inactive)" : ""}
                          </MenuItem>
                        )),
                    ];
                  });
                })()}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={showInactive}
                  onChange={handleShowInactiveChange}
                />
              }
              label="Show Inactive"
            />
          </Stack>
        </Paper>

        <Paper
          sx={{
            p: theme.spacing(3),
            maxWidth: "500px",
            width: "100%",
            boxShadow: 2,
            borderRadius: 2,
          }}
        >
          <Stack spacing={2}>
            <FormattedNumberField
              label="Unit Cost"
              name="unitCost"
              size="small"
              fullWidth
              value={formData.unitCost}
              onChange={handleInputChange}
              error={!!errors.unitCost}
              helperText={errors.unitCost}
              disabled={!itemDataReady}
            />

            {isManufacture && (
              <FormattedNumberField
                label="Standard Labour Cost Per Unit"
                name="standardLabourCost"
                size="small"
                fullWidth
                value={formData.standardLabourCost}
                onChange={handleInputChange}
                error={!!errors.standardLabourCost}
                helperText={errors.standardLabourCost}
                disabled={!itemDataReady}
              />
            )}

            {isManufacture && (
              <FormattedNumberField
                label="Standard Overhead Cost Per Unit"
                name="standardOverheadCost"
                size="small"
                fullWidth
                value={formData.standardOverheadCost}
                onChange={handleInputChange}
                error={!!errors.standardOverheadCost}
                helperText={errors.standardOverheadCost}
                disabled={!itemDataReady}
              />
            )}
          </Stack>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 3,
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 2 : 0,
            }}
          >
            <Button onClick={() => navigate("/itemsandinventory/pricingandcosts/")}>
              Back
            </Button>

            <Button
              variant="contained"
              fullWidth={isMobile}
              sx={{ backgroundColor: "var(--pallet-blue)" }}
              onClick={handleSubmit}
              disabled={!selectedItem || !itemDataReady || updateCostMutation.isPending}
            >
              Update Standard Cost
            </Button>
          </Box>
        </Paper>
      </Stack>
      <UpdateConfirmationModal
        open={open}
        title="Success"
        content="Cost has been updated!"
        handleClose={() => setOpen(false)}
        onSuccess={() => setOpen(false)}
      />
      <ErrorModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        message={errorMessage}
      />
    </FormPageLayout>
  );
}
