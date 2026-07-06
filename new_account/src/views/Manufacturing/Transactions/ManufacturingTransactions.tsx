import React from "react";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  {
    text: "WORK ORDER ENTRY",
    icon: <AssignmentIcon sx={{ fontSize: 40, color: "#1976d2" }} />,
    path: "/manufacturing/transactions/work-order-entry",
  },
  {
    text: "OUTSTANDING WORK ORDERS",
    icon: <PendingActionsIcon sx={{ fontSize: 40, color: "#1976d2" }} />,
    path: "/manufacturing/transactions/outstanding-work-orders",
  },
];

export default function ManufacturingTransactions() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="manufacturing:transactions"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
