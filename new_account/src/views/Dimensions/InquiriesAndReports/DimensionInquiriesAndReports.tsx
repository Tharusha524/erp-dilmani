import React from "react";
import SearchIcon from "@mui/icons-material/Search";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "DIMENSION INQUIRY", icon: <SearchIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/dimension/inquiriesandreports/dimension-inquiry" },
  { text: "DIMENSION REPORTS", icon: <AssessmentIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/reports", description: "Dimension analysis reports" },
];

export default function DimensionInquiriesAndReports() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="dimension:inquiries"
      items={ITEMS}
      onItemClick={(item) => {
        if (item.text === "DIMENSION REPORTS") {
          navigate("/reports", { state: { selectedClass: "Dimensions" } });
        } else {
          navigate(item.path);
        }
      }}
    />
  );
}
