import React from "react";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "COST CENTER TAGS", icon: <LocalOfferIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/costCenter/maintenance/costCenter-tags" },
];

export default function CostCenterMaintenance() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="costCenter:maintenance"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
