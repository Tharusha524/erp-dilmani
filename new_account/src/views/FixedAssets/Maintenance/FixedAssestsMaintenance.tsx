import React from "react";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import CategoryIcon from "@mui/icons-material/Category";
import ClassIcon from "@mui/icons-material/Class";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";
import { FA_MENU_CARD_COPY } from "../../../utils/fixedAssetsScreenCopy";

const ITEMS: ModuleHubItem[] = [
  { text: "FIXED ASSETS", icon: <InventoryIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/fixedassets/maintenance/fixed-assets", description: FA_MENU_CARD_COPY.assetMaster },
  { text: "FIXED ASSETS LOCATIONS", icon: <WarehouseIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/fixedassets/maintenance/fixed-asset-locations", description: FA_MENU_CARD_COPY.location },
  { text: "FIXED ASSETS CATEGORIES", icon: <CategoryIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/fixedassets/maintenance/fixed-asset-categories", description: FA_MENU_CARD_COPY.category },
  { text: "FIXED ASSETS CLASSES", icon: <ClassIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/fixedassets/maintenance/fixed-asset-classes", description: FA_MENU_CARD_COPY.class },
];

export default function FixedAssestsMaintenance() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="fixedassets:maintenance"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
