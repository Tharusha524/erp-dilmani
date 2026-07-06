import React from "react";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import StoreIcon from "@mui/icons-material/Store";
import GroupIcon from "@mui/icons-material/Group";
import RepeatIcon from "@mui/icons-material/Repeat";
import CategoryIcon from "@mui/icons-material/Category";
import PersonIcon from "@mui/icons-material/Person";
import MapIcon from "@mui/icons-material/Map";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "Add and Manage Customers", icon: <PersonAddIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/maintenance/add-and-manage-customers" },
  { text: "Customer Branches", icon: <StoreIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/maintenance/customer-branches" },
  { text: "Sales Groups", icon: <GroupIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/maintenance/sales-groups" },
  { text: "Recurrent Invoices", icon: <RepeatIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/maintenance/recurrent-invoices" },
  { text: "Sales Types", icon: <CategoryIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/maintenance/sales-types" },
  { text: "Sales Persons", icon: <PersonIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/maintenance/sales-persons" },
  { text: "Sales Areas", icon: <MapIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/maintenance/sales-areas" },
  { text: "Credit Status Setup", icon: <CreditScoreIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/maintenance/credit-status-setup" },
];

export default function SalesMaintenance() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="sales:maintenance"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
