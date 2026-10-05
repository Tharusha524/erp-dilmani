<?php

namespace App\Http\Controllers;

use App\Models\ItemCode;
use App\Models\ItemVariant;
use App\Models\StockMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BarcodeLookupController extends Controller
{
    private const LKR_CURRENCY_ID = 8;
    private const RETAIL_SALES_TYPE_ID = 3;

    /**
     * Resolve a scanned/typed barcode to a stock item.
     * Checks for a weighed-item sticker first (WT|<stock_id>|<price> — printed
     * at weigh-time for loose produce, price is frozen at the scale), then
     * item_variants.barcode (a specific size/color/weight variant), then
     * item_codes.item_code (barcode/foreign code), then falls back to
     * stock_master.stock_id for items scanned/entered by their own item code.
     *
     * Every branch (except the already-frozen WT| sticker) adds a
     * `sale_price` field — the real Selling Price from the Sales Pricing
     * table, when one is set — WITHOUT ever touching `purchase_cost`.
     * purchase_cost is used across the whole ERP (Purchase Order defaults,
     * COGS, inventory valuation) and must keep meaning "what we paid for
     * it"; POS Checkout/Weigh & Print are responsible for preferring
     * sale_price over purchase_cost when charging the customer.
     */
    public function lookup(Request $request)
    {
        $code = trim((string) $request->query('code', ''));
        if ($code === '') {
            return response()->json(['message' => 'No code provided'], 422);
        }
        // The selected customer's price list (e.g. a Wholesale customer) —
        // when given, charge that price list's rate instead of always
        // Retail. Falls back to Retail if that customer has none set, or
        // if this product has no price entry under their price list.
        $salesTypeId = $request->query('sales_type_id') !== null
            ? (int) $request->query('sales_type_id')
            : null;

        if (str_starts_with($code, 'WT|')) {
            $parts = explode('|', $code);
            if (count($parts) === 3) {
                [, $stockId, $priceStr] = $parts;
                $stock = StockMaster::where('stock_id', $stockId)->where('inactive', false)->first();
                if ($stock) {
                    $stockArray = $stock->toArray();
                    // Weighed-item price is frozen at the scale, printed as
                    // sale_price so it stays consistent with every other
                    // branch below — purchase_cost is left as the real cost.
                    $stockArray['sale_price'] = (float) $priceStr;
                    $stockArray['is_weighted'] = true;
                    return response()->json($stockArray);
                }
            }
            return response()->json(['message' => "Weighed-item sticker refers to an unknown product"], 404);
        }

        $variant = ItemVariant::where('barcode', $code)->where('inactive', false)->first();
        if ($variant) {
            $stock = StockMaster::where('stock_id', $variant->stock_id)->where('inactive', false)->first();
            if ($stock) {
                $stockArray = $stock->toArray();
                $stockArray['matched_variant'] = $variant->only(['id', 'variant_name', 'price_adjustment']);
                $baseSalePrice = $this->resolveSalePrice($stock->stock_id, $salesTypeId) ?? (float) ($stockArray['purchase_cost'] ?? 0);
                $stockArray['sale_price'] = $baseSalePrice + (float) $variant->price_adjustment;
                $stockArray['quantity'] = (float) DB::table('loc_stock')->where('stock_id', $stock->stock_id)->sum('quantity');
                return response()->json($stockArray);
            }
        }

        // item_code has no unique constraint, so more than one product can
        // share the same code (e.g. a generic "Snack" barcode used for both
        // the 50g and 100g pack). When that happens, return every match as a
        // list instead of guessing — the cashier picks the right one instead
        // of silently ringing up the wrong pack size.
        $itemCodes = ItemCode::where('item_code', $code)->where('inactive', false)->get();
        if ($itemCodes->isNotEmpty()) {
            $matches = $itemCodes
                ->map(function ($itemCode) use ($salesTypeId) {
                    $stock = StockMaster::where('stock_id', $itemCode->stock_id)->where('inactive', false)->first();
                    if (!$stock) {
                        return null;
                    }
                    $stockArray = $stock->toArray();
                    $stockArray['sale_price'] = $this->resolveSalePrice($stock->stock_id, $salesTypeId);
                    $stockArray['quantity'] = (float) DB::table('loc_stock')->where('stock_id', $stock->stock_id)->sum('quantity');
                    return $stockArray;
                })
                ->filter()
                ->unique('stock_id')
                ->values();

            if ($matches->count() > 1) {
                return response()->json(['matches' => $matches]);
            }
            if ($matches->count() === 1) {
                return response()->json($matches->first());
            }
        }

        $stock = StockMaster::where('stock_id', $code)->where('inactive', false)->first();
        if ($stock) {
            $stockArray = $stock->toArray();
            $stockArray['sale_price'] = $this->resolveSalePrice($stock->stock_id, $salesTypeId);
            $stockArray['quantity'] = (float) DB::table('loc_stock')->where('stock_id', $stock->stock_id)->sum('quantity');
            return response()->json($stockArray);
        }

        return response()->json(['message' => "No product found for code \"{$code}\""], 404);
    }

    /**
     * The real Selling Price for this product (Retail price list, LKR),
     * from the ERP's Sales Pricing feature — null when none has been set,
     * so callers can fall back to purchase_cost themselves. If an active
     * promotional price exists for today, it overrides the normal price
     * here only — Set Price and the Sales Pricing table itself are
     * untouched, so nothing needs to be manually reverted when the
     * promotion's date range ends.
     */
    private function resolveSalePrice(string $stockId, ?int $salesTypeId = null): ?float
    {
        $today = now()->toDateString();
        $promoPrice = DB::table('promotional_prices')
            ->where('stock_id', $stockId)
            ->where('active', true)
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->value('promo_price');

        if ($promoPrice !== null) {
            return (float) $promoPrice;
        }

        // Try the customer's own price list first (e.g. Wholesale) — fall
        // back to Retail if they have none set, or this product has no
        // price entry under their price list yet.
        if ($salesTypeId !== null && $salesTypeId !== self::RETAIL_SALES_TYPE_ID) {
            $price = DB::table('sales_pricing')
                ->where('stock_id', $stockId)
                ->where('currency_id', self::LKR_CURRENCY_ID)
                ->where('sales_type_id', $salesTypeId)
                ->value('price');

            if ($price !== null) {
                return (float) $price;
            }
        }

        $price = DB::table('sales_pricing')
            ->where('stock_id', $stockId)
            ->where('currency_id', self::LKR_CURRENCY_ID)
            ->where('sales_type_id', self::RETAIL_SALES_TYPE_ID)
            ->value('price');

        return $price !== null ? (float) $price : null;
    }
}
