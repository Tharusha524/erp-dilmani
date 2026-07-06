import React from "react";
import SearchIcon from "@mui/icons-material/Search";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "COST CENTER INQUIRY", icon: <SearchIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/costCenter/inquiriesandreports/costCenter-inquiry" },
  { text: "COST CENTER REPORTS", icon: <AssessmentIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/reports", description: "CostCenter analysis reports" },
];

export default function CostCenterInquiriesAndReports() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="costCenter:inquiries"
      items={ITEMS}
      onItemClick={(item) => {
        if (item.text === "COST CENTER REPORTS") {
          navigate("/reports", { state: { selectedClass: "CostCenters" } });
        } else {
          navigate(item.path);
        }
      }}
    />
  );
}
