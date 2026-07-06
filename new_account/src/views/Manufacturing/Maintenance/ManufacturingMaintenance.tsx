import React from "react";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  {
    text: "BILLS OF MATERIALS",
    icon: <AccountTreeIcon sx={{ fontSize: 40, color: "#1976d2" }} />,
    path: "/manufacturing/maintenance/bills-of-material",
  },
  {
    text: "WORK CENTERS",
    icon: <PrecisionManufacturingIcon sx={{ fontSize: 40, color: "#1976d2" }} />,
    path: "/manufacturing/maintenance/work-centres",
  },
];

export default function ManufacturingMaintenance() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="manufacturing:maintenance"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
