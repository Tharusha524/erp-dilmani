import React from "react";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PaymentIcon from "@mui/icons-material/Payment";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "PURCHASE ORDER ENTRY", icon: <RequestQuoteIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/transactions/purchase-order-entry" },
  { text: "OUTSTANDING PURCHASE ORDERS MAINTENANCE", icon: <ShoppingCartIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/transactions/outstanding-purchase-orders-maintenance" },
  { text: "RECEIVE PURCHASE ORDER ITEMS", icon: <LocalShippingIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/transactions/receive-purchase-order-items" },
  { text: "DIRECT GRN", icon: <LocalShippingIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/transactions/direct-grn" },
  { text: "DIRECT SUPPLIER INVOICE", icon: <ReceiptIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/transactions/direct-supplier-invoice" },
  { text: "PAYMENT TO SUPPLIERS", icon: <AssignmentTurnedInIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/transactions/payment-to-suppliers" },
  { text: "SUPPLIER INVOICE", icon: <PaymentIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/transactions/supplier-invoice" },
  { text: "SUPPLIER CREDIT NOTES", icon: <NoteAddIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/transactions/supplier-credit-notes" },
  { text: "ALLOCATE SUPPLIER PAYMENTS OR CREDIT NOTES", icon: <ReceiptIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/purchase/transactions/allocate-supplier-payments-credit-notes" },
];

export default function PurchaseTransactions() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="purchase:transactions"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
