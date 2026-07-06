import type { QueryClient } from "@tanstack/react-query";
import {
  voidGrnBatch,
  voidSupplierCreditNote,
  voidSupplierInvoice,
  voidSupplierPayment,
} from "../api/Purchases/PurchasesApi";
import { getFriendlyApiErrorMessage } from "./apiErrorMessage";

export async function voidPurchasingDocument(
  transType: number,
  transNo: number,
  memo?: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    if (transType === 20) {
      await voidSupplierInvoice(transNo, memo);
    } else if (transType === 21) {
      await voidSupplierCreditNote(transNo, memo);
    } else if (transType === 22) {
      await voidSupplierPayment(transNo, memo);
    } else if (transType === 25) {
      await voidGrnBatch(transNo, memo);
    } else {
      return { ok: false, message: "This document type cannot be voided from here." };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: getFriendlyApiErrorMessage(error) };
  }
}

export async function invalidatePurchasingQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["suppTrans"] }),
    queryClient.invalidateQueries({ queryKey: ["grnBatches"] }),
    queryClient.invalidateQueries({ queryKey: ["grnItems"] }),
    queryClient.invalidateQueries({ queryKey: ["purchOrders"] }),
    queryClient.invalidateQueries({ queryKey: ["suppAllocations"] }),
    queryClient.invalidateQueries({ queryKey: ["supplierTransactionInquiry"] }),
    queryClient.invalidateQueries({ queryKey: ["openGrnItems"] }),
  ]);
}
