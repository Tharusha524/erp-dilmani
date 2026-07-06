import React from "react";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "PURCHASE ORDERS INQUIRY", icon: <RequestQuoteIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/inquiriesandreports/purchase-orders-inquiry" },
  { text: "SUPPLIER TRANSACTION INQUIRY", icon: <ShoppingCartIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/inquiriesandreports/supplier-transaction-inquiry" },
  { text: "SUPPLIER ALLOCATION INQUIRY", icon: <ReceiptLongIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/inquiriesandreports/supplier-allocation-inquiry" },
  { text: "SUPPLIER & PURCHASING REPORTS", icon: <AssignmentIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/reports", description: "Supplier and purchasing analysis reports" },
];

export default function PurchaseInquiriesAndReports() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="purchase:inquiries"
      items={ITEMS}
      onItemClick={(item) => {
        if (item.text === "SUPPLIER & PURCHASING REPORTS") {
          navigate("/reports", { state: { selectedClass: "Supplier" } });
        } else {
          navigate(item.path);
        }
      }}
    />
  );
}
