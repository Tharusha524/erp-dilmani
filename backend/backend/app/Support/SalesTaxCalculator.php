<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SalesTaxCalculator
{
    /**
     * @param  array<int, array{stock_id: string, quantity: float, unit_price: float, discount_percent: float}>  $lines
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
    public function calculateDeliveryAmounts(
        int $taxGroupId,
        bool $taxIncluded,
        array $lines,
        float $freightCost = 0
    ): array {
        $groupRates = $this->groupTaxRates($taxGroupId);
        $combinedRate = array_sum(array_column($groupRates, 'rate'));

        $lineAmounts = [];
        $itemsTotal = 0.0;
        $totalNet = 0.0;
        $totalTax = 0.0;
        $taxBuckets = [];

        foreach ($lines as $idx => $line) {
            $qty = max(0, (float) ($line['quantity'] ?? 0));
            $price = (float) ($line['unit_price'] ?? 0);
            $discount = (float) ($line['discount_percent'] ?? 0);
            $lineGross = round($qty * $price * (1 - $discount / 100), 2);

            $exempt = $this->isItemTaxExempt((string) ($line['stock_id'] ?? ''));
            $rate = $exempt ? 0.0 : $combinedRate;

            if ($taxIncluded && $rate > 0) {
                $lineTax = round($lineGross * $rate / (100 + $rate), 2);
                $lineNet = round($lineGross - $lineTax, 2);
            } else {
                $lineNet = $lineGross;
                $lineTax = round($lineNet * $rate / 100, 2);
            }

            $unitTax = $qty > 0 ? round($lineTax / $qty, 4) : 0.0;
            $lineAmounts[$idx] = [
                'unit_tax' => $unitTax,
                'line_net' => $lineNet,
                'line_tax' => $lineTax,
            ];

            $itemsTotal += $lineGross;
            $totalNet += $lineNet;
            $totalTax += $lineTax;

            foreach ($groupRates as $taxRow) {
                if ($exempt) {
                    continue;
                }
                $portion = $combinedRate > 0 ? $taxRow['rate'] / $combinedRate : 0;
                $taxTypeId = (int) $taxRow['tax_type_id'];
                if (! isset($taxBuckets[$taxTypeId])) {
                    $taxBuckets[$taxTypeId] = [
                        'tax_type_id' => $taxTypeId,
                        'rate' => (float) $taxRow['rate'],
                        'net_amount' => 0.0,
                        'amount' => 0.0,
                    ];
                }
                $taxBuckets[$taxTypeId]['net_amount'] += round($lineNet * $portion, 2);
                $taxBuckets[$taxTypeId]['amount'] += round($lineTax * $portion, 2);
            }
        }

        $freightTax = 0.0;
        if ($freightCost > 0 && $groupRates !== []) {
            $shippingRate = 0.0;
            foreach ($groupRates as $taxRow) {
                if (! empty($taxRow['tax_shipping'])) {
                    $shippingRate += (float) $taxRow['rate'];
                }
            }
            if ($shippingRate <= 0) {
                $shippingRate = $combinedRate;
            }
            $freightTax = $taxIncluded
                ? round($freightCost * $shippingRate / (100 + $shippingRate), 2)
                : round($freightCost * $shippingRate / 100, 2);
            $totalTax += $freightTax;
        }

        return [
            'items_total' => round($itemsTotal, 2),
            'ov_amount' => round($taxIncluded ? $itemsTotal : $totalNet, 2),
            'ov_gst' => $taxIncluded ? 0.0 : round($totalTax, 2),
            'ov_freight_tax' => $taxIncluded ? 0.0 : round($freightTax, 2),
            'tax_included' => $taxIncluded,
            'line_amounts' => $lineAmounts,
            'tax_details' => array_values($taxBuckets),
        ];
    }

    /**
     * @return array<int, array{tax_type_id: int, rate: float, tax_shipping: bool}>
     */
    private function groupTaxRates(int $taxGroupId): array
    {
        if ($taxGroupId <= 0 || ! Schema::hasTable('tax_group_items')) {
            return [];
        }

        return DB::table('tax_group_items as tgi')
            ->join('tax_types as tt', 'tgi.tax_type_id', '=', 'tt.id')
            ->where('tgi.tax_group_id', $taxGroupId)
            ->where(function ($q) {
                $q->whereNull('tt.inactive')->orWhere('tt.inactive', 0);
            })
            ->select('tgi.tax_type_id', 'tt.default_rate as rate', 'tgi.tax_shipping')
            ->get()
            ->map(fn ($row) => [
                'tax_type_id' => (int) $row->tax_type_id,
                'rate' => (float) $row->rate,
                'tax_shipping' => (bool) $row->tax_shipping,
            ])
            ->all();
    }

    private function isItemTaxExempt(string $stockId): bool
    {
        if ($stockId === '' || ! Schema::hasTable('stock_master') || ! Schema::hasTable('item_tax_types')) {
            return false;
        }

        return (bool) DB::table('stock_master as sm')
            ->join('item_tax_types as itt', 'sm.tax_type_id', '=', 'itt.id')
            ->where('sm.stock_id', $stockId)
            ->value('itt.exempt');
    }
}
