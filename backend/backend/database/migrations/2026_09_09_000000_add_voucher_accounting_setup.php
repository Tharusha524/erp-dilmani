<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wires gift vouchers into real accounting instead of being an invisible
 * side-ledger:
 *
 *  - New liability account "Vouchers Payable" (2155, under Current
 *    Liabilities). Money taken in for a voucher is not revenue yet — it's
 *    owed back as future goods — so it must land here, not in Sales.
 *  - A "Gift Voucher" catalog item whose sales_account IS that liability
 *    account. Selling this item through the normal directInvoice() flow
 *    then posts Dr Cash/Debtor, Cr Vouchers Payable automatically, with
 *    zero new posting logic (reuses PostingsService::stockItemAccounts()).
 *    It's a Service-type item, so no inventory/COGS entries are ever
 *    generated for it (isServiceMbFlag() short-circuits those).
 *  - A "Gift Voucher Redemption" bank_accounts row pointing at the same
 *    liability account, so a voucher redemption can be posted as an
 *    ordinary customer payment (via SalesPaymentService) settling the
 *    real invoice — Dr Vouchers Payable, Cr Debtor — again with zero new
 *    posting logic.
 *
 * This migration only adds new, self-contained rows. It does not alter any
 * existing chart of accounts entry, item, or posting rule.
 */
return new class extends Migration
{
    private const LIABILITY_ACCOUNT_CODE = '2155';
    private const VOUCHER_ITEM_ID = 'GIFTVOUCHER';
    private const VOUCHER_CATEGORY_NAME = 'Gift Vouchers';
    private const REDEMPTION_BANK_ACCOUNT_NAME = 'Gift Voucher Redemption';

    public function up(): void
    {
        if (!Schema::hasTable('chart_master') || !Schema::hasTable('stock_master') || !Schema::hasTable('item_category')) {
            // Accounting module not present in this environment — nothing to wire up.
            return;
        }

        // 1) The liability account itself.
        DB::table('chart_master')->insertOrIgnore([[
            'account_code' => self::LIABILITY_ACCOUNT_CODE,
            'account_code2' => '',
            'account_name' => 'Vouchers Payable',
            'account_type' => '4', // Current Liabilities
            'inactive' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]]);

        // 2) A tax-exempt item tax type — a voucher itself isn't taxed;
        //    tax applies later, on the real goods it's redeemed against.
        //    Avoids double-taxation if we just reused the "Regular" type.
        $exemptTaxTypeId = DB::table('item_tax_types')->where('name', 'Exempt')->value('id');
        if (!$exemptTaxTypeId) {
            $exemptTaxTypeId = DB::table('item_tax_types')->insertGetId([
                'name' => 'Exempt',
                'exempt' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3) "Service" item type — a voucher has no stock/inventory movement.
        $serviceMbFlag = DB::table('item_type')->where('name', 'Service')->value('id');
        if (!$serviceMbFlag) {
            // Extremely defensive fallback; ItemTypeSeeder always provides this.
            $serviceMbFlag = DB::table('item_type')->insertGetId([
                'name' => 'Service', 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $unitId = DB::table('item_units')->orderBy('id')->value('id') ?? 1;

        // 4) A dedicated category for the voucher item, defaulting every
        //    GL slot to the liability account. cogs/inventory/adjustment/wip
        //    are never actually posted to for a Service-flag item — they're
        //    just required, non-nullable columns on this table.
        $categoryId = DB::table('item_category')->where('description', self::VOUCHER_CATEGORY_NAME)->value('category_id');
        if (!$categoryId) {
            $categoryId = DB::table('item_category')->insertGetId([
                'description' => self::VOUCHER_CATEGORY_NAME,
                'dflt_tax_type' => $exemptTaxTypeId,
                'dflt_units' => $unitId,
                'dflt_mb_flag' => $serviceMbFlag,
                'dflt_sales_act' => self::LIABILITY_ACCOUNT_CODE,
                'dflt_cogs_act' => self::LIABILITY_ACCOUNT_CODE,
                'dflt_inventory_act' => self::LIABILITY_ACCOUNT_CODE,
                'dflt_adjustment_act' => self::LIABILITY_ACCOUNT_CODE,
                'dflt_wip_act' => self::LIABILITY_ACCOUNT_CODE,
                'inactive' => 0,
                'dflt_no_sale' => 0,
                'dflt_no_purchase' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 5) The sellable item itself. Its own sales_account (used directly
        //    by PostingsService::stockItemAccounts()) is what actually
        //    routes a voucher sale to the liability account.
        DB::table('stock_master')->insertOrIgnore([[
            'stock_id' => self::VOUCHER_ITEM_ID,
            'category_id' => $categoryId,
            'tax_type_id' => $exemptTaxTypeId,
            'description' => 'Gift Voucher',
            'long_description' => 'Store gift voucher — value issued now, redeemed against a future purchase.',
            'units' => $unitId,
            'mb_flag' => $serviceMbFlag,
            'sales_account' => self::LIABILITY_ACCOUNT_CODE,
            'cogs_account' => self::LIABILITY_ACCOUNT_CODE,
            'inventory_account' => self::LIABILITY_ACCOUNT_CODE,
            'adjustment_account' => self::LIABILITY_ACCOUNT_CODE,
            'wip_account' => self::LIABILITY_ACCOUNT_CODE,
            'purchase_cost' => 0,
            'material_cost' => 0,
            'labour_cost' => 0,
            'overhead_cost' => 0,
            'inactive' => 0,
            'no_sale' => 0,
            'no_purchase' => 1,
            'editable' => 0,
            'depreciation_rate' => 0,
            'depreciation_factor' => 0,
            'depreciation_start' => now()->toDateString(),
            'depreciation_date' => now()->toDateString(),
            'created_at' => now(),
            'updated_at' => now(),
        ]]);

        // 6) A "bank account" that is really the liability account, so a
        //    voucher redemption can be posted through the existing customer
        //    payment flow (Dr Vouchers Payable, Cr Debtor) with no new
        //    posting code.
        if (Schema::hasTable('bank_accounts') && Schema::hasTable('account_types') && Schema::hasTable('currencies')) {
            $accountTypeId = DB::table('account_types')->where('type_name', 'Credit Account')->value('id')
                ?? DB::table('account_types')->orderBy('id')->value('id');

            $currencyCode = DB::table('company_setup')
                ->join('currencies', 'currencies.id', '=', 'company_setup.home_currency_id')
                ->value('currencies.currency_abbreviation')
                ?? DB::table('bank_accounts')->value('bank_curr_code')
                ?? DB::table('currencies')->orderBy('currency_abbreviation')->value('currency_abbreviation');

            if ($accountTypeId && $currencyCode) {
                DB::table('bank_accounts')->insertOrIgnore([[
                    'bank_account_name' => self::REDEMPTION_BANK_ACCOUNT_NAME,
                    'account_type' => $accountTypeId,
                    'bank_curr_code' => $currencyCode,
                    'default_curr_act' => false,
                    'account_gl_code' => self::LIABILITY_ACCOUNT_CODE,
                    'bank_charges_act' => self::LIABILITY_ACCOUNT_CODE,
                    'bank_name' => '',
                    'bank_account_number' => 'VOUCHER-REDEMPTION',
                    'inactive' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('bank_accounts')) {
            DB::table('bank_accounts')->where('bank_account_name', self::REDEMPTION_BANK_ACCOUNT_NAME)->delete();
        }
        if (Schema::hasTable('stock_master')) {
            DB::table('stock_master')->where('stock_id', self::VOUCHER_ITEM_ID)->delete();
        }
        if (Schema::hasTable('item_category')) {
            DB::table('item_category')->where('description', self::VOUCHER_CATEGORY_NAME)->delete();
        }
        if (Schema::hasTable('chart_master')) {
            DB::table('chart_master')->where('account_code', self::LIABILITY_ACCOUNT_CODE)->delete();
        }
    }
};
