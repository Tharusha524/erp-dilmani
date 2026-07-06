<?php

namespace App\Support;

/**
 * Metadata for system preferences (FrontAccounting-style sys_prefs).
 */
class SysPrefsDefinitions
{
    public static function all(): array
    {
        return [
            ['name' => 'pastDueDaysInterval', 'category' => 'glsetup.general', 'type' => 'number', 'length' => 11, 'value' => '30'],
            ['name' => 'accountType', 'category' => 'glsetup.general', 'type' => 'string', 'length' => 20, 'value' => '1'],
            ['name' => 'retainedEarnings', 'category' => 'glsetup.general', 'type' => 'string', 'length' => 15, 'value' => '3590'],
            ['name' => 'profitLossYear', 'category' => 'glsetup.general', 'type' => 'string', 'length' => 15, 'value' => '9990'],
            ['name' => 'exchangeVariancesAccount', 'category' => 'glsetup.general', 'type' => 'string', 'length' => 15, 'value' => '4450'],
            ['name' => 'bankChargesAccount', 'category' => 'glsetup.general', 'type' => 'string', 'length' => 15, 'value' => '5690'],
            ['name' => 'taxAlgorithm', 'category' => 'glsetup.general', 'type' => 'string', 'length' => 20, 'value' => '1'],
            ['name' => 'dimensionRequiredByAfter', 'category' => 'glsetup.dimensions', 'type' => 'number', 'length' => 11, 'value' => '1'],
            ['name' => 'defaultCreditLimit', 'category' => 'glsetup.customer', 'type' => 'number', 'length' => 11, 'value' => '1000'],
            ['name' => 'invoiceIdentification', 'category' => 'glsetup.customer', 'type' => 'string', 'length' => 20, 'value' => '1'],
            ['name' => 'accumulateBatchShipping', 'category' => 'glsetup.customer', 'type' => 'boolean', 'length' => null, 'value' => 'false'],
            ['name' => 'printItemImageOnQuote', 'category' => 'glsetup.customer', 'type' => 'boolean', 'length' => null, 'value' => 'false'],
            ['name' => 'legalTextOnInvoice', 'category' => 'glsetup.customer', 'type' => 'text', 'length' => null, 'value' => ''],
            ['name' => 'shippingChargedAccount', 'category' => 'glsetup.customer', 'type' => 'string', 'length' => 15, 'value' => '4430'],
            ['name' => 'deferredIncomeAccount', 'category' => 'glsetup.customer', 'type' => 'string', 'length' => 15, 'value' => '2105'],
            ['name' => 'receivableAccount', 'category' => 'glsetup.sales', 'type' => 'string', 'length' => 15, 'value' => '1200'],
            ['name' => 'salesAccount', 'category' => 'glsetup.sales', 'type' => 'string', 'length' => 15, 'value' => '4010'],
            ['name' => 'salesDiscountAccount', 'category' => 'glsetup.sales', 'type' => 'string', 'length' => 15, 'value' => '4510'],
            ['name' => 'promptPaymentDiscountAccount', 'category' => 'glsetup.sales', 'type' => 'string', 'length' => 15, 'value' => '4510'],
            ['name' => 'quoteValidDays', 'category' => 'glsetup.sales', 'type' => 'number', 'length' => 11, 'value' => '30'],
            ['name' => 'deliveryRequiredBy', 'category' => 'glsetup.sales', 'type' => 'number', 'length' => 11, 'value' => '1'],
            ['name' => 'deliveryOverReceiveAllowance', 'category' => 'glsetup.purchase', 'type' => 'number', 'length' => 11, 'value' => '10'],
            ['name' => 'invoiceOverChangeAllowance', 'category' => 'glsetup.purchase', 'type' => 'number', 'length' => 11, 'value' => '10'],
            ['name' => 'payableAccount', 'category' => 'glsetup.purchase', 'type' => 'string', 'length' => 15, 'value' => '2100'],
            ['name' => 'purchaseDiscountAccount', 'category' => 'glsetup.purchase', 'type' => 'string', 'length' => 15, 'value' => '5040'],
            ['name' => 'grnClearingAccount', 'category' => 'glsetup.purchase', 'type' => 'string', 'length' => 15, 'value' => '1550'],
            ['name' => 'receivalRequiredBy', 'category' => 'glsetup.purchase', 'type' => 'number', 'length' => 11, 'value' => '1'],
            ['name' => 'allowNegativeInventory', 'category' => 'glsetup.inventory', 'type' => 'boolean', 'length' => null, 'value' => 'false'],
            ['name' => 'noZeroAmountsService', 'category' => 'glsetup.inventory', 'type' => 'boolean', 'length' => null, 'value' => 'false'],
            ['name' => 'locationNotification', 'category' => 'glsetup.inventory', 'type' => 'boolean', 'length' => null, 'value' => 'false'],
            ['name' => 'allowNegativePrices', 'category' => 'glsetup.inventory', 'type' => 'boolean', 'length' => null, 'value' => 'false'],
            ['name' => 'itemSalesAccount', 'category' => 'glsetup.items', 'type' => 'string', 'length' => 15, 'value' => '4010'],
            ['name' => 'inventoryAccount', 'category' => 'glsetup.items', 'type' => 'string', 'length' => 15, 'value' => '1510'],
            ['name' => 'cogsAccount', 'category' => 'glsetup.items', 'type' => 'string', 'length' => 15, 'value' => '5010'],
            ['name' => 'inventoryAdjustmentsAccount', 'category' => 'glsetup.items', 'type' => 'string', 'length' => 15, 'value' => '5020'],
            ['name' => 'wipAccount', 'category' => 'glsetup.items', 'type' => 'string', 'length' => 15, 'value' => '1530'],
            ['name' => 'lossOnAssetDisposalAccount', 'category' => 'glsetup.fixedassets', 'type' => 'string', 'length' => 15, 'value' => '5660'],
            ['name' => 'depreciationPeriod', 'category' => 'glsetup.fixedassets', 'type' => 'string', 'length' => 20, 'value' => '1'],
            ['name' => 'workOrderRequiredByAfter', 'category' => 'glsetup.manuf', 'type' => 'number', 'length' => 11, 'value' => '1'],
        ];
    }

    public static function byName(): array
    {
        $map = [];
        foreach (self::all() as $row) {
            $map[$row['name']] = $row;
        }
        return $map;
    }
}
