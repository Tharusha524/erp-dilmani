import React from "react";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";
import { FA_MENU_CARD_COPY } from "../../../utils/fixedAssetsScreenCopy";

const ITEMS: ModuleHubItem[] = [
  { text: "FIXED ASSETS PURCHASE", icon: <ShoppingCartIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/fixedassets/transactions/fixed-assets-purchase", description: FA_MENU_CARD_COPY.purchase },
  { text: "FIXED ASSETS LOCATION TRANSFER", icon: <SwapHorizIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/fixedassets/transactions/fixed-assets-location-transfer", description: FA_MENU_CARD_COPY.transfer },
  { text: "FIXED ASSETS DISPOSAL", icon: <DeleteOutlineIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/fixedassets/transactions/fixed-assets-disposal", description: FA_MENU_CARD_COPY.disposal },
  { text: "FIXED ASSETS SALE", icon: <PointOfSaleIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/fixedassets/transactions/fixed-assets-sale", description: FA_MENU_CARD_COPY.sale },
  { text: "PROCESS DEPRECIATION", icon: <TrendingDownIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/fixedassets/transactions/process-depreciation", description: FA_MENU_CARD_COPY.depreciation },
];

export default function FixedAssestsTransactions() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="fixedassets:transactions"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
