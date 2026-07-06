import React from "react";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "COST CENTER ENTRY", icon: <AddCircleOutlineIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/costCenter/transactions/costCenter-entry" },
  { text: "OUTSTANDING COST CENTERS", icon: <ListAltIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/costCenter/transactions/outstanding-costCenters" },
];

export default function CostCenterTransactions() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="costCenter:transactions"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
