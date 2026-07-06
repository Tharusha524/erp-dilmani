import React from "react";
import { useTransactionMoney } from "../hooks/useTransactionMoney";

interface TransactionMoneyProps {
  value: number | string | null | undefined;
  currency?: string | null;
  decimals?: number;
}

export default function TransactionMoney({
  value,
  currency,
  decimals = 2,
}: TransactionMoneyProps) {
  const { formatMoney } = useTransactionMoney(currency);
  return <>{formatMoney(value, decimals)}</>;
}
