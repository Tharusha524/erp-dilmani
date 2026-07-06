import React from "react";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PaymentIcon from "@mui/icons-material/Payment";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import DescriptionIcon from "@mui/icons-material/Description";
import PrintIcon from "@mui/icons-material/Print";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "SALES QUOTATION ENTRY", icon: <RequestQuoteIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/sales-quotation-entry" },
  { text: "SALES ORDER ENTRY", icon: <ShoppingCartIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/sales-order-entry" },
  { text: "DIRECT DELIVERY", icon: <LocalShippingIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/direct-delivery" },
  { text: "DIRECT INVOICE", icon: <ReceiptIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/direct-invoice" },
  { text: "DELIVERY AGAINST SALES ORDERS", icon: <AssignmentTurnedInIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/delivery-against-sales-orders" },
  { text: "INVOICE AGAINST SALES DELIVERY", icon: <PaymentIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/invoice-against-sales-delivery" },
  { text: "INVOICE PREPAID ORDERS", icon: <NoteAddIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/invoice-prepaid-orders" },
  { text: "TEMPLATE DELIVERY", icon: <DescriptionIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/template-delivery" },
  { text: "TEMPLATE INVOICE", icon: <ReceiptIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/template-invoice" },
  { text: "CREATE AND PRINT RECURRENT INVOICES", icon: <PrintIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/create-print-recurrent-invoices" },
  { text: "CUSTOMER PAYMENTS", icon: <AccountBalanceWalletIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/customer-payments" },
  { text: "CUSTOMER CREDIT NOTES", icon: <CreditScoreIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/customer-credit-notes" },
  { text: "ALLOCATE CUSTOMER PAYMENTS OR CREDIT NOTES", icon: <AssignmentTurnedInIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/sales/transactions/allocate-customer-payments-credit-notes" },
];

export default function SalesTransactions() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="sales:transactions"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
