import React from "react";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "INVENTORY ITEM MOVEMENTS", icon: <SwapHorizIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/itemsandinventory/inquiriesandreports/inventory-item-movements" },
  { text: "INVENTORY ITEM STATUS", icon: <InventoryIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/itemsandinventory/inquiriesandreports/inventory-item-status" },
  { text: "INVENTORY REPORTS", icon: <AssessmentIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/reports", description: "Stock valuation and inventory reports" },
];

export default function ItemsInquiriesAndReports() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="inventory:inquiries"
      items={ITEMS}
      onItemClick={(item) => {
        if (item.text === "INVENTORY REPORTS") {
          navigate("/reports", { state: { selectedClass: "Inventory" } });
        } else {
          navigate(item.path);
        }
      }}
    />
  );
}
