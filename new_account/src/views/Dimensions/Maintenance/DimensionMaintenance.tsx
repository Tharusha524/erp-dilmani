import React from "react";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "DIMENSION TAGS", icon: <LocalOfferIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/dimension/maintenance/dimension-tags" },
];

export default function DimensionMaintenance() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="dimension:maintenance"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
