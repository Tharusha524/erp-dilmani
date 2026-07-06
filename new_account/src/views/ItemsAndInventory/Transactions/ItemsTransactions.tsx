import React from "react";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TuneIcon from "@mui/icons-material/Tune";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "INVENTORY LOCATION TRANSFER", icon: <SwapHorizIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/itemsandinventory/transactions/inventory-location-transfer" },
  { text: "INVENTORY ADJUSTMENTS", icon: <TuneIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/itemsandinventory/transactions/inventory-adjustments" },
];

export default function ItemsTransactions() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="inventory:transactions"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
