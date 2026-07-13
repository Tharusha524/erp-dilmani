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
  FormHelperText,
  Button,
  Divider,
  Grid,
  ListSubheader,
} from "@mui/material";
import theme from "../../../../../theme";
import { getItemTaxTypes } from "../../../../../api/ItemTaxType/ItemTaxTypeApi";
import { getChartMasters } from "../../../../../api/GLAccounts/ChartMasterApi";
import { getItemUnits } from "../../../../../api/ItemUnit/ItemUnitApi";
import { getItemCategories } from "../../../../../api/ItemCategories/ItemCategoriesApi";
import { getStockFaClasses } from "../../../../../api/StockFaClass/StockFaClassesApi";
import { getDepreciationMethods } from "../../../../../api/DepreciationMethod/DepreciationMethodApi";
import { createItem, getItemById, updateItem } from "../../../../../api/Item/ItemApi";
import { getInventoryLocations } from "../../../../../api/InventoryLocation/InventoryLocationApi";
import { createLocStock } from "../../../../../api/LocStock/LocStockApi";
import DatePickerComponent from "../../../../../components/DatePickerComponent";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import AddedConfirmationModal from "../../../../../components/AddedConfirmationModal";
import ErrorModal from "../../../../../components/ErrorModal";
import {
  depreciationMethodTypeCode,
  straightLineAnnualDepreciation,
} from "../../../../../utils/faDepreciation";
import FormattedNumberField from "../../../../../components/FormattedNumberField";

interface ItemGeneralSettingProps {
  itemId?: string | number;
}

export default function FixedAssetsGeneralSettingsForm({ itemId }: ItemGeneralSettingProps) {

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    itemCode: "",
    itemName: "",
    description: "",
    category: "",
    itemTaxType: "",
    unitOfMeasure: "",
    fixedAssetClass: "",
    depreciationMethod: "",
    baseRate: "",
    rateMultiplier: "",
    salvageValue: "0",
    usefulLifeYears: "",
    estimatedCost: "0",
    depreciationStart: null as Date | null,
    costCenter: "",
    salesAccount: "",
    assetAccount: "",
    depreciationCostAccount: "",
    depreciationDisposalAccount: "",
    imageFile: null as File | null,
    itemStatus: "",
  });

  const accountTypeMap: { [key: number]: string } = {
    1: "Current Assets",
    2: "Inventory Assets",
    3: "Capital Assets",
    4: "Current Liabilities",
    5: "Long Term Liabilities",
    6: "Share Capital",
    7: "Retained Earnings",
    8: "Sales Revenue",
    9: "Other Revenue",
    10: "Cost of Good Sold",
    11: "Payroll Expenses",
    12: "General and Administrative Expenses",
  };

  const [chartMasters, setChartMasters] = useState<any[]>([]);
  const [itemTaxTypes, setItemTaxTypes] = useState<any[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<any[]>([]);
  const [itemCategories, setItemCategories] = useState<any[]>([]);
  const [faClasses, setFaClasses] = useState<any[]>([]);
  const [depreciationMethods, setDepreciationMethods] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [open, setOpen] = useState(false);
    const [errorOpen, setErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel (include depreciation methods)
        const [chartMastersRes, taxTypesRes, unitsRes, itemCategoriesRes, depreciationMethodsRes] = await Promise.all([
          getChartMasters(),
          getItemTaxTypes(),
          getItemUnits(),
          getItemCategories(),
          getDepreciationMethods(),
        ]);

        const filteredTaxTypes = (taxTypesRes || []).filter((type) => !type.inactive);
        const filteredUnits = (unitsRes || []).filter((unit) => !unit.inactive);
        const filteredItemCategories = (itemCategoriesRes || [])
          .filter((cat) => !cat.inactive)
          .filter((cat) => Number(cat.dflt_mb_flag) === 4);

        setChartMasters(chartMastersRes || []);
        setItemTaxTypes(filteredTaxTypes);
        setUnitsOfMeasure(filteredUnits);
        setItemCategories(filteredItemCategories);

        // load fixed asset classes
        try {
          const faRes = await getStockFaClasses();
          setFaClasses((faRes || []).filter((c: any) => !c.inactive));
        } catch (faErr) {
          console.error("Failed to load FA classes:", faErr);
        }

        // depreciation methods may come as axios response (with .data) or plain array
        const depMethods = (typeof depreciationMethodsRes !== "undefined") ? (depreciationMethodsRes && (depreciationMethodsRes.data ?? depreciationMethodsRes)) : [];
        setDepreciationMethods(depMethods || []);

        // Set default values for dropdowns
        setFormData((prev) => ({
          ...prev,
          // use category_id (API uses this key) for defaults
          category: filteredItemCategories.length > 0 ? String(filteredItemCategories[0].category_id ?? filteredItemCategories[0].id) : "",
          itemTaxType: filteredTaxTypes.length > 0 ? String(filteredTaxTypes[0].id) : "",
          unitOfMeasure: filteredUnits.length > 0 ? String(filteredUnits[0].id) : "",
          salesAccount: chartMastersRes.find((acc) => acc.account_code === "4010")?.account_code || "",
          assetAccount: chartMastersRes.find((acc) => acc.account_code === "1510")?.account_code || "",
          depreciationCostAccount: chartMastersRes.find((acc) => acc.account_code === "5010")?.account_code || "",
          depreciationDisposalAccount: chartMastersRes.find((acc) => acc.account_code === "5040")?.account_code || "",
          depreciationMethod: (depMethods && depMethods.length > 0)
            ? String(depMethods.find((m: any) => m.type === "S")?.type ?? depMethods[0].type ?? "S")
            : "S",
        }));
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (field: string, value: string | boolean | File | Date | null) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: "" }); // clear error
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  // Helper: determine if selected depreciation method is Straight Line
  const isStraightLineMethod = (methodId?: string | number) => {
    if (!methodId) return false;
    const idStr = String(methodId).toLowerCase();
    // If the dropdown contains simple keys like 'straight-line' or 's'
    if (idStr === "straight-line" || idStr === "s" || idStr === "straight") return true;
    // Try to find method by id in loaded methods
    const m = depreciationMethods.find((dm: any) => {
      const key = String(dm.id ?? dm.depreciation_method_id ?? dm.method_id ?? dm.code ?? dm.description ?? "").toLowerCase();
      return key === idStr;
    });
    if (!m) return false;
    const code = String(m.code ?? m.type ?? m.method_code ?? "").toLowerCase();
    const desc = String(m.description ?? m.name ?? "").toLowerCase();
    return code === "s" || desc.includes("straight");
  };

  // Helper: determine if selected depreciation method is Other (type 'O')
  const isOtherMethod = (methodId?: string | number) => {
    if (!methodId) return false;
    const idStr = String(methodId).toLowerCase();
    if (idStr === "o" || idStr === "other") return true;
    const m = depreciationMethods.find((dm: any) => {
      const key = String(dm.id ?? dm.depreciation_method_id ?? dm.method_id ?? dm.code ?? dm.description ?? "").toLowerCase();
      return key === idStr;
    });
    if (!m) return false;
    const code = String(m.code ?? m.type ?? m.method_code ?? "").toLowerCase();
    const desc = String(m.description ?? m.name ?? "").toLowerCase();
    return code === "o" || desc.includes("other") || desc.includes("One-time");
  };

  // Helper: determine if selected depreciation method is N (Sum of the Years' Digits)
  const isNoneMethod = (methodId?: string | number) => {
    if (!methodId) return false;
    const idStr = String(methodId).toLowerCase();
    // common identifiers: 'n', 'sum-of-years', 'sum', 'year-digits', 'sum of years'
    if (idStr === "n" || idStr === "sum-of-years" || idStr === "sum" || idStr.includes("sum") || idStr.includes("year") && idStr.includes("digit")) return true;
    const m = depreciationMethods.find((dm: any) => {
      const key = String(dm.id ?? dm.depreciation_method_id ?? dm.method_id ?? dm.code ?? dm.description ?? "").toLowerCase();
      return key === idStr;
    });
    if (!m) return false;
    const code = String(m.code ?? m.type ?? m.method_code ?? "").toLowerCase();
    const desc = String(m.description ?? m.name ?? "").toLowerCase();
    return code === "n" || desc.includes("sum") || desc.includes("year") && desc.includes("digit");
  };

  // Helper: determine if selected depreciation method is Declining Balance (D)
  const isDecliningMethod = (methodId?: string | number) => {
    if (!methodId) return false;
    const idStr = String(methodId).toLowerCase();
    if (idStr === "d" || idStr === "declining" || idStr.includes("declin")) return true;
    const m = depreciationMethods.find((dm: any) => {
      const key = String(dm.id ?? dm.depreciation_method_id ?? dm.method_id ?? dm.code ?? dm.description ?? "").toLowerCase();
      return key === idStr;
    });
    if (!m) return false;
    const code = String(m.code ?? m.type ?? m.method_code ?? "").toLowerCase();
    const desc = String(m.description ?? m.name ?? "").toLowerCase();
    return code === "d" || desc.includes("declin") || desc.includes("declining");
  };

  // Helper: S or D
  const isSOrDMethod = (methodId?: string | number) => {
    return isStraightLineMethod(methodId) || isDecliningMethod(methodId);
  };

  // When fixedAssetClass or depreciation method changes, update Base Rate from selected FA class depreciation_rate
  // but only when depreciation method is S (Straight-line) or D (Declining Balance); do not override when method is Other/Zero
  useEffect(() => {
    if (!formData.fixedAssetClass) return;
    if (!isSOrDMethod(formData.depreciationMethod)) return;
    if (isOtherMethod(formData.depreciationMethod)) return;
    const selected = faClasses.find((f: any) => String(f.fa_class_id) === String(formData.fixedAssetClass));
    if (selected && selected.depreciation_rate !== undefined && selected.depreciation_rate !== null) {
      setFormData(prev => ({ ...prev, baseRate: String(selected.depreciation_rate) }));
    }
  }, [formData.fixedAssetClass, faClasses, formData.depreciationMethod, depreciationMethods]);

  // Clear rateMultiplier when depreciation method is Straight Line (S) or Other (O)
  useEffect(() => {
    if ((isStraightLineMethod(formData.depreciationMethod) || isOtherMethod(formData.depreciationMethod)) && formData.rateMultiplier) {
      setFormData(prev => ({ ...prev, rateMultiplier: "" }));
    }
  }, [formData.depreciationMethod, depreciationMethods]);

  // When method type = 'O' (Other), force Depreciation Rate (baseRate) to 100 and disable editing
  useEffect(() => {
    if (isOtherMethod(formData.depreciationMethod)) {
      if (formData.baseRate !== "100") setFormData(prev => ({ ...prev, baseRate: "100" }));
    }
  }, [formData.depreciationMethod, depreciationMethods]);

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};

    if (!formData.itemCode) tempErrors.itemCode = "Item Code is required";
    if (!formData.itemName) tempErrors.itemName = "Item Name is required";
    if (!formData.description) tempErrors.description = "Description is required";
    if (!formData.category) tempErrors.category = "Category is required";
    if (!formData.itemTaxType) tempErrors.itemTaxType = "Item Tax Type is required";
    if (!formData.unitOfMeasure) tempErrors.unitOfMeasure = "Unit of Measure is required";
    if (!formData.salesAccount) tempErrors.salesAccount = "Sales Account is required";
    if (!formData.assetAccount) tempErrors.assetAccount = "Asset Account is required";
    if (!formData.depreciationCostAccount) tempErrors.depreciationCostAccount = "Depreciation Cost Account is required";
    if (!formData.depreciationDisposalAccount) tempErrors.depreciationDisposalAccount = "Depreciation/Disposal Account is required";

    // Business rule: cannot add when depreciation method type = 'N'
    if (isNoneMethod(formData.depreciationMethod)) {
      tempErrors.depreciationMethod = "Depreciation method type 'N' is not allowed for adding fixed assets";
    }

    if (isStraightLineMethod(formData.depreciationMethod)) {
      const life = parseInt(formData.usefulLifeYears, 10);
      if (!Number.isFinite(life) || life <= 0) {
        tempErrors.usefulLifeYears = "Useful life (years) is required for straight line";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const methodCode = depreciationMethodTypeCode(formData.depreciationMethod, depreciationMethods);
    const cost = parseFloat(formData.estimatedCost) || 0;
    const salvage = parseFloat(formData.salvageValue) || 0;
    const lifeYears = parseInt(formData.usefulLifeYears, 10) || 0;
    const derivedRate =
      methodCode === "S" && cost > 0 && lifeYears > 0
        ? ((Math.max(0, cost - salvage) / cost) * 100) / lifeYears
        : parseFloat(formData.baseRate) || 0;

    const payload = {
      stock_id: formData.itemCode, // required
      category_id: parseInt(formData.category),
      tax_type_id: parseInt(formData.itemTaxType),
      description: formData.itemName,
      long_description: formData.description,
      units: parseInt(formData.unitOfMeasure),
      mb_flag: 4,
      sales_account: formData.salesAccount,
      inventory_account: formData.assetAccount,
      cogs_account: formData.depreciationCostAccount,
      adjustment_account: formData.depreciationDisposalAccount,
      wip_account: '1530',
      inactive: formData.itemStatus === "Inactive" ? 1 : 0,
      purchase_cost: cost,
      salvage_value: salvage,
      useful_life_years: lifeYears,
      material_cost: cost,
      labour_cost: 0,
      overhead_cost: 0,
      depreciation_method: methodCode,
      depreciation_rate: derivedRate,
      depreciation_factor: parseFloat(formData.rateMultiplier) || 0,
      depreciation_start: formData.depreciationStart ? formData.depreciationStart.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      // depreciation_date must be >= depreciation_start, default to same as depreciation_start
      depreciation_date: formData.depreciationStart ? formData.depreciationStart.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      fa_class_id: formData.fixedAssetClass,
      imageFile: formData.imageFile
    };


    try {
      const res = await createItem(payload); // your API call
      const newStockId = formData.itemCode;

      // Fetch inventory locations and create loc_stock records
      const locations = await getInventoryLocations();
      const locStockPromises = locations.map(location =>
        createLocStock({
          loc_code: location.loc_code,
          stock_id: newStockId,
          reorder_level: 0,
        })
      );
      await Promise.all(locStockPromises);
      setOpen(true);
      //alert("Fixed Asset added successfully!");
      console.log("Created:", res);
      queryClient.invalidateQueries({ queryKey: ["items"], exact: false });

      setFormData((prev) => ({
        ...prev,
        itemCode: "",
        itemName: "",
        description: "",
        imageFile: null,
      }));
    } catch (err: any) {
      console.error("Failed to create item:", err);
      const message = err?.response?.data?.message || err?.message || "Failed to add Fixed Asset.";
      // Show server validation details if present
      if (err?.response?.data?.errors) {
        const errs = err.response.data.errors;
        const details = Object.entries(errs).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('; ') : v}`).join('\n');
        //alert(`${message}\n${details}`);
         setErrorOpen(true);
      } else {
        alert(message);
      }
    }
  };


  return (
    <Stack alignItems="center" sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: "1200px",
          p: theme.spacing(3),
          boxShadow: theme.shadows[2],
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="h5" sx={{ mb: theme.spacing(3), textAlign: "center" }}>
          Fixed Asset Setup
        </Typography>

        <Grid container spacing={4}>
          {/* General Settings */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Typography variant="subtitle1">General</Typography>
              <Divider />
              <TextField
                label="Item Code"
                value={formData.itemCode}
                onChange={(e) => handleChange("itemCode", e.target.value)}
                size="small"
                fullWidth
                error={!!errors.itemCode}
                helperText={errors.itemCode}
              />
              <TextField
                label="Name"
                value={formData.itemName}
                onChange={(e) => handleChange("itemName", e.target.value)}
                size="small"
                fullWidth
                error={!!errors.itemName}
                helperText={errors.itemName}
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                size="small"
                fullWidth
                error={!!errors.description}
                helperText={errors.description}
              />

              <FormControl size="small" fullWidth error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  name="category"
                  onChange={handleSelectChange} // same as other dropdowns
                >
                  {itemCategories.map((cat) => (
                    <MenuItem key={cat.category_id} value={String(cat.category_id ?? cat.id)}>
                      {cat.description}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.category}</FormHelperText>
              </FormControl>

              <FormControl size="small" fullWidth error={!!errors.itemTaxType}>
                <InputLabel>Item Tax Type</InputLabel>
                <Select
                  name="itemTaxType"
                  value={formData.itemTaxType}
                  onChange={handleSelectChange}
                  label="Item Tax Type"
                >
                  {itemTaxTypes.map((type) => (
                    <MenuItem key={type.id} value={String(type.id)}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.itemTaxType || " "}</FormHelperText>
              </FormControl>

              <FormControl size="small" fullWidth error={!!errors.unitOfMeasure}>
                <InputLabel>Unit of Measure</InputLabel>
                <Select
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleSelectChange}
                  label="Unit of Measure"
                >
                  {unitsOfMeasure.map((unit) => (
                    <MenuItem key={unit.id} value={String(unit.id)}>
                      {unit.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.unitOfMeasure}</FormHelperText>
              </FormControl>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>Depreciation</Typography>
              <Divider />

              <FormControl size="small" fullWidth>
                <InputLabel>Fixed Asset Class</InputLabel>
                <Select
                  name="fixedAssetClass"
                  value={formData.fixedAssetClass}
                  onChange={handleSelectChange}
                  label="Fixed Asset Class"
                >
                  {faClasses.map((f: any) => (
                    <MenuItem key={f.fa_class_id} value={String(f.fa_class_id)}>
                      {f.fa_class_id} - {f.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth error={!!errors.depreciationMethod}>
                <InputLabel>Depreciation Method</InputLabel>
                <Select
                  name="depreciationMethod"
                  value={formData.depreciationMethod}
                  onChange={handleSelectChange}
                  label="Depreciation Method"
                >
                  {depreciationMethods && depreciationMethods.length > 0 ? (
                    depreciationMethods.map((m: any) => {
                      const code = String(m.type ?? m.code ?? m.id ?? "");
                      const label = m.description ?? m.name ?? code;
                      return (
                        <MenuItem key={code} value={code}>
                          {label}
                        </MenuItem>
                      );
                    })
                  ) : (
                    <>
                    </>
                  )}
                </Select>
                <FormHelperText>{errors.depreciationMethod || "Straight line: (Cost − Salvage) ÷ Useful Life"}</FormHelperText>
              </FormControl>

              {isStraightLineMethod(formData.depreciationMethod) ? (
                <>
                  <FormattedNumberField
                    label="Estimated Cost"
                    value={formData.estimatedCost}
                    onChange={(e) => handleChange("estimatedCost", e.target.value)}
                    size="small"
                    fullWidth
                    helperText="Updated from purchase if asset is bought later"
                  />
                  <FormattedNumberField
                    label="Salvage Value"
                    value={formData.salvageValue}
                    onChange={(e) => handleChange("salvageValue", e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <FormattedNumberField
                    label="Useful Life (Years)"
                    value={formData.usefulLifeYears}
                    onChange={(e) => handleChange("usefulLifeYears", e.target.value)}
                    size="small"
                    fullWidth
                    error={!!errors.usefulLifeYears}
                    helperText={
                      errors.usefulLifeYears ||
                      (() => {
                        const c = parseFloat(formData.estimatedCost) || 0;
                        const s = parseFloat(formData.salvageValue) || 0;
                        const y = parseInt(formData.usefulLifeYears, 10) || 0;
                        if (c > 0 && y > 0) {
                          return `Annual depreciation: ${straightLineAnnualDepreciation(c, s, y).toLocaleString()}`;
                        }
                        return "Land: set useful life to 0 and method to skip depreciation";
                      })()
                    }
                  />
                </>
              ) : (
              <FormattedNumberField
                label={(isOtherMethod(formData.depreciationMethod) || isStraightLineMethod(formData.depreciationMethod)) ? "Depreciation Rate (%)" : "Base Rate (%)"}
                value={formData.baseRate}
                onChange={(e) => handleChange("baseRate", e.target.value)}
                size="small"
                fullWidth
                disabled={isOtherMethod(formData.depreciationMethod)}
              />
              )}

              {!(isStraightLineMethod(formData.depreciationMethod) || isOtherMethod(formData.depreciationMethod)) && (
                <FormattedNumberField
                  label="Rate Multiplier"
                  value={formData.rateMultiplier}
                  onChange={(e) => handleChange("rateMultiplier", e.target.value)}
                  size="small"
                  fullWidth
                />
              )}

              <DatePickerComponent
                label="Depreciation Start"
                value={formData.depreciationStart}
                onChange={(date) => handleChange("depreciationStart", date)}
              />

              <Typography variant="subtitle1" sx={{ mt: 2 }}>Cost Center</Typography>
              <Divider />

              <FormControl size="small" fullWidth>
                <InputLabel>Cost Center</InputLabel>
                <Select
                  name="costCenter"
                  value={formData.costCenter}
                  onChange={handleSelectChange}
                  label="Cost Center"
                >
                  <MenuItem value="costCenter1">CostCenter 1</MenuItem>
                  <MenuItem value="costCenter2">CostCenter 2</MenuItem>
                  <MenuItem value="costCenter3">CostCenter 3</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Grid>

          {/* GL Accounts */}
          <Grid item xs={12} md={6}>
            <Stack spacing={4}>
              <Stack spacing={2}>
                <Typography variant="subtitle1">GL Account</Typography>
                <Divider />
                <FormControl size="small" fullWidth error={!!errors.salesAccount}>
                  <InputLabel>Sales Account</InputLabel>
                  <Select
                    name="salesAccount"
                    value={formData.salesAccount}
                    onChange={handleSelectChange}
                    label="Sales Account"
                  >
                    {(() => {
                      const groupedAccounts: { [key: string]: any[] } = {};
                      chartMasters.forEach((acc) => {
                        const type = acc.account_type || "Unknown";
                        if (!groupedAccounts[type]) groupedAccounts[type] = [];
                        groupedAccounts[type].push(acc);
                      });

                      return Object.entries(groupedAccounts).flatMap(([typeKey, accounts]) => {
                        const typeText = accountTypeMap[Number(typeKey)] || "Unknown";
                        return [
                          <ListSubheader key={`header-${typeKey}`}>{typeText}</ListSubheader>,
                          ...accounts.map((acc) => (
                            <MenuItem key={acc.account_code} value={acc.account_code}>
                              <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
                                {acc.account_code} - {acc.account_name}
                              </Stack>
                            </MenuItem>
                          )),
                        ];
                      });
                    })()}
                  </Select>
                  <FormHelperText>{errors.salesAccount}</FormHelperText>
                </FormControl>

                <FormControl size="small" fullWidth error={!!errors.assetAccount}>
                  <InputLabel>Asset Account</InputLabel>
                  <Select
                    name="assetAccount"
                    value={formData.assetAccount}
                    onChange={handleSelectChange}
                    label="Asset Account"
                  >
                    {(() => {
                      const groupedAccounts: { [key: string]: any[] } = {};
                      chartMasters.forEach((acc) => {
                        const type = acc.account_type || "Unknown";
                        if (!groupedAccounts[type]) groupedAccounts[type] = [];
                        groupedAccounts[type].push(acc);
                      });

                      return Object.entries(groupedAccounts).flatMap(([typeKey, accounts]) => {
                        const typeText = accountTypeMap[Number(typeKey)] || "Unknown";
                        return [
                          <ListSubheader key={`header-${typeKey}`}>{typeText}</ListSubheader>,
                          ...accounts.map((acc) => (
                            <MenuItem key={acc.account_code} value={acc.account_code}>
                              <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
                                {acc.account_code} - {acc.account_name}
                              </Stack>
                            </MenuItem>
                          )),
                        ];
                      });
                    })()}
                  </Select>
                  <FormHelperText>{errors.inventoryAccount || " "}</FormHelperText>
                </FormControl>

                <FormControl size="small" fullWidth error={!!errors.depreciationCostAccount}>
                  <InputLabel>Depreciation Cost Account</InputLabel>
                  <Select
                    name="depreciationCostAccount"
                    value={formData.depreciationCostAccount}
                    onChange={handleSelectChange}
                    label="Depreciation Cost Account"
                  >
                    {(() => {
                      const groupedAccounts: { [key: string]: any[] } = {};
                      chartMasters.forEach((acc) => {
                        const type = acc.account_type || "Unknown";
                        if (!groupedAccounts[type]) groupedAccounts[type] = [];
                        groupedAccounts[type].push(acc);
                      });

                      return Object.entries(groupedAccounts).flatMap(([typeKey, accounts]) => {
                        const typeText = accountTypeMap[Number(typeKey)] || "Unknown";
                        return [
                          <ListSubheader key={`header-${typeKey}`}>{typeText}</ListSubheader>,
                          ...accounts.map((acc) => (
                            <MenuItem key={acc.account_code} value={acc.account_code}>
                              <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
                                {acc.account_code} - {acc.account_name}
                              </Stack>
                            </MenuItem>
                          )),
                        ];
                      });
                    })()}
                  </Select>
                  <FormHelperText>{errors.cogsAccount || " "}</FormHelperText>
                </FormControl>

                <FormControl size="small" fullWidth error={!!errors.depreciationDisposalAccount}>
                  <InputLabel>Depreciation/Disposal Account</InputLabel>
                  <Select
                    name="depreciationDisposalAccount"
                    value={formData.depreciationDisposalAccount}
                    onChange={handleSelectChange}
                    label="Depreciation/Disposal Account"
                  >
                    {(() => {
                      const groupedAccounts: { [key: string]: any[] } = {};
                      chartMasters.forEach((acc) => {
                        const type = acc.account_type || "Unknown";
                        if (!groupedAccounts[type]) groupedAccounts[type] = [];
                        groupedAccounts[type].push(acc);
                      });

                      return Object.entries(groupedAccounts).flatMap(([typeKey, accounts]) => {
                        const typeText = accountTypeMap[Number(typeKey)] || "Unknown";
                        return [
                          <ListSubheader key={`header-${typeKey}`}>{typeText}</ListSubheader>,
                          ...accounts.map((acc) => (
                            <MenuItem key={acc.account_code} value={acc.account_code}>
                              <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
                                {acc.account_code} - {acc.account_name}
                              </Stack>
                            </MenuItem>
                          )),
                        ];
                      });
                    })()}
                  </Select>
                  <FormHelperText>{errors.inventoryAdjustmentAccount || " "}</FormHelperText>
                </FormControl>
              </Stack>


              {/* Other */}

              <Stack spacing={2}>
                <Typography variant="subtitle1">Other</Typography>
                <Divider />
                <Button
                  variant="outlined"
                  component="label"
                >
                  Upload Image (.jpg)
                  <input
                    type="file"
                    hidden
                    accept=".jpg"
                    onChange={(e) => handleChange("imageFile", e.target.files ? e.target.files[0] : null)}
                  />
                </Button>
                <FormControl size="small" fullWidth>
                  <InputLabel>Item Status</InputLabel>
                  <Select
                    value={formData.itemStatus}
                    onChange={(e) => handleChange("itemStatus", e.target.value)}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: theme.spacing(4),
            flexDirection: { xs: "column", sm: "row" },
            gap: theme.spacing(2),
          }}
        >
          <Button variant="outlined" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: theme.palette.primary.main }}
            onClick={handleSubmit}
          >
            Insert New Fixed Asset
          </Button>
        </Box>
      </Box>
        <AddedConfirmationModal
              open={open}
              title="Success"
              content="Fixed Assets has been added successfully!"
              addFunc={async () => { }}
              handleClose={() => setOpen(false)}
              onSuccess={() => {
                // Form was already cleared on successful submission
                setOpen(false);
              }}
            />
      
            <ErrorModal
              open={errorOpen}
              onClose={() => setErrorOpen(false)}
              message={errorMessage}
            />
    </Stack>
  );
}
