import React from "react";
import InventoryIcon from "@mui/icons-material/Inventory";
import QrCodeIcon from "@mui/icons-material/QrCode";
import CategoryIcon from "@mui/icons-material/Category";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import StraightenIcon from "@mui/icons-material/Straighten";
import LowPriorityIcon from "@mui/icons-material/LowPriority";
import WidgetsIcon from "@mui/icons-material/Widgets";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "ITEMS", icon: <InventoryIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/itemsandinventory/maintenance/items" },
  { text: "FOREIGN ITEM CODES", icon: <QrCodeIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/itemsandinventory/maintenance/foreign-item-codes" },
  { text: "SALES KITS", icon: <WidgetsIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/itemsandinventory/maintenance/sales-kits" },
  { text: "ITEM CATEGORIES", icon: <CategoryIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/itemsandinventory/maintenance/item-categories" },
  { text: "INVENTORY LOCATIONS", icon: <WarehouseIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/itemsandinventory/maintenance/inventory-locations" },
  { text: "UNITS OF MEASURE", icon: <StraightenIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/itemsandinventory/maintenance/units-of-measure" },
  { text: "REORDER LEVELS", icon: <LowPriorityIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/itemsandinventory/maintenance/reorder-levels" },
];

export default function ItemsMaintenance() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="inventory:maintenance"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
