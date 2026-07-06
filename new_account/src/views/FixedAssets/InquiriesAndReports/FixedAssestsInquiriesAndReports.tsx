import React from "react";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SearchIcon from "@mui/icons-material/Search";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";
import { FA_MENU_CARD_COPY } from "../../../utils/fixedAssetsScreenCopy";

const ITEMS: ModuleHubItem[] = [
  { text: "FIXED ASSET MOVEMENTS", icon: <SwapHorizIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/fixedassets/inquiriesandreports/fixed-asset-movements", description: FA_MENU_CARD_COPY.movements },
  { text: "FIXED ASSETS INQUIRY", icon: <SearchIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/fixedassets/inquiriesandreports/fixed-assets-inquiry", description: FA_MENU_CARD_COPY.inquiry },
  { text: "FIXED ASSET REPORTS", icon: <AssessmentIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/reports", description: FA_MENU_CARD_COPY.reports },
];

export default function FixedAssestsInquiriesAndReports() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="fixedassets:inquiries"
      items={ITEMS}
      onItemClick={(item) => {
        if (item.text === "FIXED ASSET REPORTS") {
          navigate("/reports", { state: { selectedClass: "FixedAssets" } });
        } else {
          navigate(item.path);
        }
      }}
    />
  );
}
