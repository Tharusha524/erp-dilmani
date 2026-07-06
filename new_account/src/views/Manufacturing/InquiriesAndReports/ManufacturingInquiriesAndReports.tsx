import React from "react";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import SearchIcon from "@mui/icons-material/Search";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  {
    text: "COSTED BILL OF MATERIAL INQUIRY",
    icon: <RequestQuoteIcon sx={{ fontSize: 40, color: "#1976d2" }} />,
    path: "/manufacturing/inquiriesandreports/costed-bill-of-material-inquiry",
  },
  {
    text: "INVENTORY ITEM WHERE USED INQUIRY",
    icon: <SearchIcon sx={{ fontSize: 40, color: "#1976d2" }} />,
    path: "/manufacturing/inquiriesandreports/inventory-item-where-used-inquiry",
  },
  {
    text: "WORK ORDER INQUIRY",
    icon: <AssignmentIcon sx={{ fontSize: 40, color: "#1976d2" }} />,
    path: "/manufacturing/inquiriesandreports/work-order-inquiry",
  },
  {
    text: "MANUFACTURING REPORTS",
    icon: <AssessmentIcon sx={{ fontSize: 40, color: "#1976d2" }} />,
    path: "/reports",
    description: "Work order and manufacturing analysis reports",
  },
];

export default function ManufacturingInquiriesAndReports() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="manufacturing:inquiries"
      items={ITEMS}
      onItemClick={(item) => {
        if (item.text === "MANUFACTURING REPORTS") {
          navigate("/reports", { state: { selectedClass: "Manufacturing" } });
        } else {
          navigate(item.path);
        }
      }}
    />
  );
}
