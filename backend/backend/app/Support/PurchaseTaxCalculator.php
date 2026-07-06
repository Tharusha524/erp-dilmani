<?php

namespace App\Support;

use App\Models\Supplier;
use Illuminate\Support\Facades\Schema;

/**
 * FrontAccounting get_tax_for_items() for supplier purchases — uses supplier tax_group.
 */
class PurchaseTaxCalculator
{
    public function __construct(
        private SalesTaxCalculator $salesTax,
    ) {}

    /**
     * @param  array<int, array{stock_id: string, quantity: float, unit_price: float, discount_percent?: float}>  $lines
     * @return array{
     *     items_total: float,
     *     ov_amount: float,
     *     ov_gst: float,
     *     ov_freight_tax: float,
     *     tax_included: bool,
     *     line_amounts: array<int, array{unit_tax: float, line_net: float, line_tax: float}>,
     *     tax_details: array<int, array{tax_type_id: int, rate: float, net_amount: float, amount: float}>
     * }
     */
    public function calculateForSupplier(
        int $supplierId,
        bool $taxIncluded,
        array $lines,
        float $freightCost = 0
    ): array {
        $taxGroupId = 0;
        if ($supplierId > 0 && Schema::hasTable('suppliers')) {
            $taxGroupId = (int) (Supplier::query()->where('supplier_id', $supplierId)->value('tax_group') ?? 0);
        }

        return $this->salesTax->calculateDeliveryAmounts($taxGroupId, $taxIncluded, $lines, $freightCost);
    }
}
