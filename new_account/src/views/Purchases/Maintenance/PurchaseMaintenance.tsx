import React from "react";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "SUPPLIERS", icon: <PersonAddIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/maintenance/suppliers" },
];

export default function PurchaseMaintenance() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="purchase:maintenance"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
