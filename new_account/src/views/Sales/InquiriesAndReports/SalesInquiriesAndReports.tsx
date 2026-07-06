import React from "react";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "SALES QUOTATION INQUIRY", icon: <RequestQuoteIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/inquiriesandreports/sales-quotation-inquiry" },
  { text: "SALES ORDER INQUIRY", icon: <ShoppingCartIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/inquiriesandreports/sales-order-inquiry" },
  { text: "CUSTOMER TRANSACTION INQUIRY", icon: <ReceiptLongIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/inquiriesandreports/customer-transaction-inquiry" },
  { text: "CUSTOMER ALLOCATION INQUIRY", icon: <AssignmentIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/inquiriesandreports/customer-allocation-inquiry" },
  { text: "CUSTOMER AND SALES REPORTS", icon: <AssessmentIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/reports", description: "Sales analysis and customer reports" },
];

export default function SalesInquiriesAndReports() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="sales:inquiries"
      items={ITEMS}
      onItemClick={(item) => {
        if (item.text === "CUSTOMER AND SALES REPORTS") {
          navigate("/reports", { state: { selectedClass: "Customer" } });
        } else {
          navigate(item.path);
        }
      }}
    />
  );
}
