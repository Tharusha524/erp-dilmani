import React from "react";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PieChartIcon from "@mui/icons-material/PieChart";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { useNavigate } from "react-router";
import ModuleHubLayout, { type ModuleHubItem } from "../../../components/ModuleHubLayout";

const ITEMS: ModuleHubItem[] = [
  { text: "PAYMENTS", icon: <PaymentIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/bankingandgeneralledger/transactions/payments" },
  { text: "DEPOSITS", icon: <AccountBalanceIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/bankingandgeneralledger/transactions/deposits" },
  { text: "BANK ACCOUNT TRANSFERS", icon: <SwapHorizIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/bankingandgeneralledger/transactions/bank-account-transfers" },
  { text: "JOURNAL ENTRY", icon: <MenuBookIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/bankingandgeneralledger/transactions/journal-entry" },
  { text: "BUDGET ENTRY", icon: <PieChartIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/bankingandgeneralledger/transactions/budget-entry" },
  { text: "RECONCILE BANK ACCOUNT", icon: <FactCheckIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/bankingandgeneralledger/transactions/reconcile-bank-account" },
  { text: "REVENU / COST ACCRUALS", icon: <ScheduleIcon sx={{ fontSize: 40, color: "#1976d2" }} />, path: "/bankingandgeneralledger/transactions/revenue-cost-accruals" },
];

export default function BankingTransactions() {
  const navigate = useNavigate();
  return (
    <ModuleHubLayout
      hubKey="banking:transactions"
      items={ITEMS}
      onItemClick={(item) => navigate(item.path)}
    />
  );
}
