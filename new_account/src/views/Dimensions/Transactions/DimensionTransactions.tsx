import React from "react";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "DIMENSION ENTRY", icon: <AddCircleOutlineIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/dimension/transactions/dimension-entry" },
  { text: "OUTSTANDING DIMENSIONS", icon: <ListAltIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/dimension/transactions/outstanding-dimensions" },
];

export default function DimensionTransactions() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="dimension:transactions"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
