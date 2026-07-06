import { getItemById } from "../api/Item/ItemApi";
import { getSalesPricingByStockId } from "../api/SalesPricing/SalesPricingApi";

export function pricingCurrencyCode(pricing: any): string {
  return String(
    pricing?.currency?.currency_abbreviation ??
      pricing?.currency_abbreviation ??
      pricing?.currency_code ??
      ""
  ).toUpperCase();
}

export function pickPricingForSalesType(
  pricingList: any[],
  stockId: string,
  salesTypeId: string | number,
  currencyCode?: string | null,
  homeCurrencyCode?: string | null
): any | null {
  const matches = (pricingList || []).filter(
    (p: any) =>
      Number(p.sales_type_id) === Number(salesTypeId) &&
      String(p.stock_id ?? p.stockId ?? p.stock) === String(stockId)
  );

  if (matches.length === 0) {
    return null;
  }

  const want = currencyCode?.toUpperCase() || "";
  const home = homeCurrencyCode?.toUpperCase() || "";

  if (want) {
    const exact = matches.find((p) => pricingCurrencyCode(p) === want);
    if (exact) {
      return exact;
    }
  }

  if (home && home !== want) {
    const homeMatch = matches.find((p) => pricingCurrencyCode(p) === home);
    if (homeMatch) {
      return homeMatch;
    }
  }

  return matches[0];
}

export function priceFromPricingRecord(pricing: any): number {
  return Number(
    pricing?.price ??
      pricing?.price_after_tax ??
      pricing?.priceAfterTax ??
      pricing?.price_before_tax ??
      pricing?.priceBeforeTax ??
      0
  );
}

export function linePricesFromPricingRecord(pricing: any): {
  priceAfterTax: number;
  priceBeforeTax: number;
} {
  const after = Number(
    pricing?.price_after_tax ?? pricing?.priceAfterTax ?? pricing?.price ?? 0
  );
  const before = Number(
    pricing?.price_before_tax ?? pricing?.priceBeforeTax ?? pricing?.price ?? 0
  );
  return { priceAfterTax: after, priceBeforeTax: before };
}

function wholesaleFallbackPrice(
  pricingList: any[],
  stockId: string,
  salesTypes: any[],
  salesTypeId: string | number,
  currencyCode?: string | null,
  homeCurrencyCode?: string | null,
  materialCost = 0
): number {
  const selectedPriceList = salesTypes.find(
    (pl: any) => Number(pl.id) === Number(salesTypeId)
  );
  let fallbackPrice = materialCost;

  if (selectedPriceList?.typeName === "Wholesale") {
    const retailPriceList = salesTypes.find((pl: any) => pl.typeName === "Retail");
    const factor = Number(selectedPriceList.factor ?? 1);
    if (retailPriceList) {
      const retailPricing = pickPricingForSalesType(
        pricingList,
        stockId,
        retailPriceList.id,
        currencyCode,
        homeCurrencyCode
      );
      fallbackPrice = retailPricing
        ? priceFromPricingRecord(retailPricing) * factor
        : materialCost * factor;
    } else {
      fallbackPrice = materialCost * factor;
    }
  }

  return fallbackPrice;
}

/** Resolve before/after tax unit prices from an in-memory pricing list. */
export function resolveSalesItemLinePrices(params: {
  pricingList: any[];
  stockId: string;
  salesTypeId: string | number;
  salesTypes?: any[];
  currencyCode?: string | null;
  homeCurrencyCode?: string | null;
  materialCost?: number;
}): { priceAfterTax: number; priceBeforeTax: number } {
  const {
    pricingList,
    stockId,
    salesTypeId,
    salesTypes = [],
    currencyCode,
    homeCurrencyCode,
    materialCost = 0,
  } = params;

  const pricing = pickPricingForSalesType(
    pricingList,
    stockId,
    salesTypeId,
    currencyCode,
    homeCurrencyCode
  );

  if (pricing) {
    return linePricesFromPricingRecord(pricing);
  }

  const fallback = wholesaleFallbackPrice(
    pricingList,
    stockId,
    salesTypes,
    salesTypeId,
    currencyCode,
    homeCurrencyCode,
    materialCost
  );

  return { priceAfterTax: fallback, priceBeforeTax: fallback };
}

export async function fetchSalesItemLinePrices(
  stockId: string,
  salesTypeId: string | number,
  salesTypes: any[] = [],
  currencyCode?: string | null,
  homeCurrencyCode?: string | null,
  cachedPricingList?: any[]
): Promise<{
  priceAfterTax: number;
  priceBeforeTax: number;
  material_cost: number;
}> {
  const itemData = await getItemById(stockId);
  const materialCost = Number(itemData?.material_cost ?? itemData?.purchase_cost ?? 0);
  const pricingList = cachedPricingList ?? (await getSalesPricingByStockId(stockId));
  const { priceAfterTax, priceBeforeTax } = resolveSalesItemLinePrices({
    pricingList,
    stockId,
    salesTypeId,
    salesTypes,
    currencyCode,
    homeCurrencyCode,
    materialCost,
  });

  return { priceAfterTax, priceBeforeTax, material_cost: materialCost };
}

/** Resolve unit price for a stock item + price list (customer currency aware). */
export async function resolveSalesItemPrice(
  stockId: string,
  salesTypeId: string | number,
  salesTypes: any[] = [],
  currencyCode?: string | null,
  homeCurrencyCode?: string | null,
  cachedPricingList?: any[]
): Promise<{ price: number; material_cost: number }> {
  const { priceAfterTax, priceBeforeTax, material_cost } = await fetchSalesItemLinePrices(
    stockId,
    salesTypeId,
    salesTypes,
    currencyCode,
    homeCurrencyCode,
    cachedPricingList
  );

  const selectedPriceList = salesTypes.find(
    (pl: any) => Number(pl.id) === Number(salesTypeId)
  );
  const price = selectedPriceList?.taxIncl ? priceAfterTax : priceBeforeTax;

  return { price, material_cost };
}
