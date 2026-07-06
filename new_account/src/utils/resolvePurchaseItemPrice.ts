import { getItemById } from "../api/Item/ItemApi";
import { getPurchDataById } from "../api/PurchasingPricing/PurchasingPricingApi";

/** Unit purchase price for supplier + item (supplier-currency amount). */
export async function resolvePurchaseItemPrice(
  supplierId: number,
  stockId: string
): Promise<{ price: number; material_cost: number }> {
  const itemData = await getItemById(stockId);
  const materialCost = Number(
    itemData?.material_cost ?? itemData?.purchase_cost ?? 0
  );

  if (!supplierId || !stockId) {
    return { price: materialCost, material_cost: materialCost };
  }

  try {
    const purch = await getPurchDataById(supplierId, stockId);
    if (purch?.price != null && Number.isFinite(Number(purch.price))) {
      return { price: Number(purch.price), material_cost: materialCost };
    }
  } catch {
    // No supplier-specific price — fall back to item cost
  }

  return { price: materialCost, material_cost: materialCost };
}
