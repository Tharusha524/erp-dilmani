<?php

namespace App\Console\Commands;

use App\Services\FiscalYear\TransactionReferenceService;
use App\Services\Manufacturing\ManufacturingPostingService;
use App\Services\Purchasing\GrnReceiptService;
use App\Services\Sales\SalesDeliveryService;
use App\Support\ItemMbFlag;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Seeds the Water Bottle manufacturing + sales walkthrough (RM001–RM003, FG001).
 *
 * Standard path only: Items → GRN → BOM → Advanced WO → Release → Produce → Sales.
 * Does not add variance reporting, shop-floor consumption UI, BOM-prefilled issue, or WO status labels.
 */
class WaterBottleManufacturingDemoCommand extends Command
{
    private const RM_CODES = ['RM001', 'RM002', 'RM003'];

    private const RM_NAMES = [
        'RM001' => 'Empty Bottle Raw Material',
        'RM002' => 'Bottle Cap',
        'RM003' => 'Label',
    ];

    private const FG_CODE = 'FG001';

    private const FG_NAME = 'Water Bottle';

    private const GRN_QTY = 500.0;

    private const GRN_UNIT_PRICE = 10.0;

    private const WO_QTY = 100.0;

    private const PRODUCE_QTY = 98.0;

    private const SALES_QTY = 20.0;

    private const SALES_UNIT_PRICE = 50.0;

    private const WORK_CENTRE_NAME = 'Bottling Line';

    protected $signature = 'manufacturing:water-bottle-demo
                            {--run-transactions : Also create WO, release, produce 98, and deliver 20 FG001}
                            {--skip-grn : Skip direct GRN when RM stock is already on hand}
                            {--loc=WH1 : Inventory location for raw materials, BOM, WO, and FG stock}';

    protected $description = 'Seed Water Bottle demo master data (RM001–RM003, FG001, BOM, GRN) for the 13-step manufacturing story';

    public function handle(
        GrnReceiptService $grn,
        ManufacturingPostingService $manufacturing,
        SalesDeliveryService $sales,
        TransactionReferenceService $references,
    ): int {
        if (! Schema::hasTable('stock_master')) {
            $this->error('stock_master table not found. Run migrations first.');

            return self::FAILURE;
        }

        $locCode = strtoupper(trim((string) $this->option('loc')));
        if ($locCode === '' || ! DB::table('inventory_locations')->where('loc_code', $locCode)->exists()) {
            $this->error("Location {$locCode} not found. Create it in Setup or use --loc=HQ.");

            return self::FAILURE;
        }

        $this->info('Water Bottle manufacturing demo — master data');
        $this->enableManufacturing();
        $workCentreId = $this->ensureWorkCentre();
        $this->ensureRawMaterials($locCode);
        $this->ensureFinishedGood($locCode);
        $this->ensureBom($workCentreId, $locCode);

        if (! $this->option('skip-grn')) {
            $this->receiveRawMaterials($grn, $locCode);
        } else {
            $this->line('  Skipping GRN (--skip-grn).');
        }

        $this->newLine();
        $this->printStockSummary($locCode);

        if ($this->option('run-transactions')) {
            $this->newLine();
            $this->info('Running transactional steps (WO → Release → Produce 98 → Sales 20)...');
            $this->runTransactions($manufacturing, $sales, $references, $locCode);
            $this->newLine();
            $this->printStockSummary($locCode);
        }

        $this->newLine();
        $this->printUiWalkthrough($locCode);

        return self::SUCCESS;
    }

    private function enableManufacturing(): void
    {
        if (! Schema::hasTable('company_setup')) {
            return;
        }

        $row = DB::table('company_setup')->orderBy('id')->first();
        if (! $row) {
            return;
        }

        if (! (bool) ($row->manufacturing_enabled ?? false)) {
            DB::table('company_setup')->where('id', $row->id)->update([
                'manufacturing_enabled' => true,
                'updated_at' => now(),
            ]);
            $this->line('  Enabled manufacturing in company setup.');
        } else {
            $this->line('  Manufacturing already enabled.');
        }
    }

    private function ensureWorkCentre(): int
    {
        $existing = DB::table('work_centres')->where('name', self::WORK_CENTRE_NAME)->value('id');
        if ($existing) {
            $this->line('  Work centre: '.self::WORK_CENTRE_NAME." (#{$existing})");

            return (int) $existing;
        }

        $id = (int) DB::table('work_centres')->insertGetId([
            'name' => self::WORK_CENTRE_NAME,
            'description' => 'Water bottle assembly line (demo)',
            'inactive' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->line('  Created work centre: '.self::WORK_CENTRE_NAME." (#{$id})");

        return $id;
    }

    private function ensureRawMaterials(string $locCode): void
    {
        $categoryId = $this->resolveCategoryId('Raw Materials', ItemMbFlag::PURCHASED);
        foreach (self::RM_CODES as $code) {
            $this->upsertItem($code, self::RM_NAMES[$code], ItemMbFlag::PURCHASED, $categoryId);
        }
        $this->line('  Raw materials: '.implode(', ', self::RM_CODES).' (purchased)');
    }

    private function ensureFinishedGood(string $locCode): void
    {
        $categoryId = $this->resolveCategoryId('Finished Goods', ItemMbFlag::MANUFACTURED);
        $this->upsertItem(self::FG_CODE, self::FG_NAME, ItemMbFlag::MANUFACTURED, $categoryId);
        $this->line('  Finished good: '.self::FG_CODE.' — '.self::FG_NAME.' (manufactured)');
    }

    private function resolveCategoryId(string $preferredDescription, int $mbFlag): int
    {
        $preferred = DB::table('item_category')
            ->where('description', $preferredDescription)
            ->where('inactive', false)
            ->value('category_id');

        if ($preferred !== null) {
            return (int) $preferred;
        }

        $byFlag = DB::table('item_category')
            ->where('dflt_mb_flag', $mbFlag)
            ->where('inactive', false)
            ->orderBy('category_id')
            ->value('category_id');

        if ($byFlag !== null) {
            return (int) $byFlag;
        }

        $any = DB::table('item_category')->where('inactive', false)->orderBy('category_id')->value('category_id');
        if ($any !== null) {
            return (int) $any;
        }

        throw new \RuntimeException('No item category found. Create item categories in Setup first.');
    }

    private function upsertItem(string $stockId, string $description, int $mbFlag, int $categoryId): void
    {
        $category = DB::table('item_category')->where('category_id', $categoryId)->first();
        if (! $category) {
            throw new \RuntimeException("Item category {$categoryId} not found.");
        }

        $payload = [
            'category_id' => $categoryId,
            'tax_type_id' => (int) ($category->dflt_tax_type ?? 1),
            'description' => $description,
            'long_description' => $description,
            'units' => (int) ($category->dflt_units ?? 1),
            'mb_flag' => $mbFlag,
            'sales_account' => (string) ($category->dflt_sales_act ?? '4010'),
            'cogs_account' => (string) ($category->dflt_cogs_act ?? '5010'),
            'inventory_account' => (string) ($category->dflt_inventory_act ?? '1510'),
            'adjustment_account' => (string) ($category->dflt_adjustment_act ?? '5040'),
            'wip_account' => (string) ($category->dflt_wip_act ?? '1530'),
            'dimension_id' => 0,
            'dimension2_id' => 0,
            'purchase_cost' => self::GRN_UNIT_PRICE,
            'material_cost' => self::GRN_UNIT_PRICE,
            'labour_cost' => 0,
            'overhead_cost' => 0,
            'inactive' => false,
            'no_sale' => false,
            'no_purchase' => $mbFlag === ItemMbFlag::PURCHASED ? false : true,
            'editable' => true,
            'depreciation_method' => null,
            'depreciation_rate' => 0,
            'depreciation_factor' => 0,
            'depreciation_start' => '2000-01-01',
            'depreciation_date' => '2000-01-01',
            'updated_at' => now(),
        ];

        if (DB::table('stock_master')->where('stock_id', $stockId)->exists()) {
            DB::table('stock_master')->where('stock_id', $stockId)->update($payload);
        } else {
            DB::table('stock_master')->insert(array_merge($payload, [
                'stock_id' => $stockId,
                'created_at' => now(),
            ]));
        }
    }

    private function ensureBom(int $workCentreId, string $locCode): void
    {
        if (! Schema::hasTable('bom')) {
            return;
        }

        DB::table('bom')->where('parent', self::FG_CODE)->delete();

        foreach (self::RM_CODES as $component) {
            DB::table('bom')->insert([
                'parent' => self::FG_CODE,
                'component' => $component,
                'work_centre' => $workCentreId,
                'loc_code' => $locCode,
                'quantity' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->line('  BOM: '.self::FG_CODE.' = 1× '.implode(' + 1× ', self::RM_CODES));
    }

    private function receiveRawMaterials(GrnReceiptService $grn, string $locCode): void
    {
        $supplierId = $this->resolveSupplierId();
        $today = now()->toDateString();

        $needsGrn = false;
        foreach (self::RM_CODES as $code) {
            $onHand = $this->quantityOnHand($code, $locCode);
            if ($onHand < self::GRN_QTY - 0.01) {
                $needsGrn = true;
                break;
            }
        }

        if (! $needsGrn) {
            $this->line('  GRN skipped — each RM already has ≥ '.self::GRN_QTY." at {$locCode}.");

            return;
        }

        $lines = [];
        foreach (self::RM_CODES as $code) {
            $lines[] = [
                'item_code' => $code,
                'description' => self::RM_NAMES[$code],
                'quantity' => self::GRN_QTY,
                'unit_price' => self::GRN_UNIT_PRICE,
            ];
        }

        $result = $grn->directGrn([
            'supplier_id' => $supplierId,
            'delivery_date' => $today,
            'into_stock_location' => $locCode,
            'comments' => 'Water Bottle demo — raw materials GRN',
            'lines' => $lines,
        ]);

        $ref = (string) ($result['reference'] ?? '');
        $this->line('  Direct GRN posted: '.$ref.' — '.self::GRN_QTY.' each RM @ '.self::GRN_UNIT_PRICE." into {$locCode}");
        if (! empty($result['gl_warning'])) {
            $this->warn('  GL warning: '.$result['gl_warning']);
        }
    }

    private function runTransactions(
        ManufacturingPostingService $manufacturing,
        SalesDeliveryService $sales,
        TransactionReferenceService $references,
        string $locCode,
    ): void {
        $today = now()->toDateString();
        $refData = $references->next(ManufacturingPostingService::TYPE_WORKORDER, $today);
        $woRef = (string) ($refData['reference'] ?? 'WB-DEMO-'.now()->format('Ymd'));

        $wo = $manufacturing->createWorkOrder([
            'wo_ref' => $woRef,
            'loc_code' => $locCode,
            'units_reqd' => self::WO_QTY,
            'stock_id' => self::FG_CODE,
            'date' => $today,
            'type' => ManufacturingPostingService::WO_ADVANCED,
            'required_by' => $today,
            'memo' => 'Water Bottle demo WO — 100 planned',
        ]);
        $woId = (int) ($wo['id'] ?? 0);
        $this->line("  Work order #{$woId} created ({$woRef}, qty ".self::WO_QTY.')');

        $manufacturing->releaseWorkOrder($woId, [
            'released_date' => $today,
            'memo' => 'Released for production',
        ]);
        $this->line("  Work order #{$woId} released (BOM → requirements)");

        $produce = $manufacturing->produce([
            'workorder_id' => $woId,
            'quantity' => self::PRODUCE_QTY,
            'date' => $today,
            'memo' => 'Produced '.self::PRODUCE_QTY.' FG (2 scrapped in demo story)',
            'close' => true,
        ]);
        $this->line('  Produced '.self::PRODUCE_QTY.' '.self::FG_CODE.' (WO closed)');
        if (! empty($produce['gl_warning'])) {
            $this->warn('  GL warning: '.$produce['gl_warning']);
        }

        $customer = $this->resolveCustomerBranch($locCode);
        $orderType = $this->resolveSalesTypeId($customer['debtor_no']);
        $delivery = $sales->dispatchDirect([
            'debtor_no' => $customer['debtor_no'],
            'branch_code' => $customer['branch_code'],
            'tran_date' => $today,
            'order_type' => $orderType,
            'from_stk_loc' => $locCode,
            'comments' => 'Water Bottle demo — sales delivery',
            'lines' => [
                [
                    'stock_id' => self::FG_CODE,
                    'quantity' => self::SALES_QTY,
                    'unit_price' => self::SALES_UNIT_PRICE,
                ],
            ],
        ]);
        $delRef = (string) ($delivery['reference'] ?? '');
        $this->line('  Sales delivery: '.$delRef.' — '.self::SALES_QTY.' × '.self::FG_CODE.' @ '.self::SALES_UNIT_PRICE);
        if (! empty($delivery['gl_warning'])) {
            $this->warn('  GL warning: '.$delivery['gl_warning']);
        }
    }

    private function resolveSupplierId(): int
    {
        $existing = DB::table('suppliers')->where('inactive', false)->orderBy('supplier_id')->value('supplier_id');
        if ($existing) {
            return (int) $existing;
        }

        $currency = DB::table('currencies')->orderBy('currency_abbreviation')->value('currency_abbreviation') ?? 'LKR';

        return (int) DB::table('suppliers')->insertGetId([
            'supp_name' => 'Demo Materials Supplier',
            'supp_short_name' => 'DEMO-SUP',
            'gst_no' => '',
            'website' => '',
            'curr_code' => $currency,
            'tax_group' => null,
            'supp_account_no' => '',
            'bank_account' => '',
            'credit_limit' => 0,
            'payment_terms' => null,
            'tax_included' => false,
            'payable_account' => '2100',
            'purchase_account' => '5010',
            'payment_discount_account' => '5060',
            'contact' => 'Demo',
            'dimension_id' => 0,
            'dimension2_id' => 0,
            'mail_address' => 'Demo supplier',
            'bill_address' => 'Demo supplier',
            'notes' => 'Created by manufacturing:water-bottle-demo',
            'inactive' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * @return array{debtor_no: int, branch_code: int}
     */
    private function resolveCustomerBranch(string $locCode): array
    {
        $debtorNo = (int) (DB::table('debtors_master')->where('inactive', false)->orderBy('debtor_no')->value('debtor_no') ?? 0);
        if ($debtorNo <= 0) {
            throw new \RuntimeException('No active customer found. Seed debtors_master first.');
        }

        $branchCode = (int) DB::table('cust_branch')
            ->where('debtor_no', $debtorNo)
            ->where('inactive', false)
            ->orderBy('branch_code')
            ->value('branch_code');

        if ($branchCode <= 0) {
            $branchCode = (int) DB::table('cust_branch')->insertGetId([
                'debtor_no' => $debtorNo,
                'br_name' => 'Main Branch',
                'branch_ref' => 'MAIN',
                'br_address' => DB::table('debtors_master')->where('debtor_no', $debtorNo)->value('address') ?? '',
                'inventory_location' => $locCode,
                'inactive' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return ['debtor_no' => $debtorNo, 'branch_code' => $branchCode];
    }

    private function resolveSalesTypeId(int $debtorNo): int
    {
        $fromDebtor = (int) (DB::table('debtors_master')->where('debtor_no', $debtorNo)->value('sales_type') ?? 0);
        if ($fromDebtor > 0 && DB::table('sales_types')->where('id', $fromDebtor)->exists()) {
            return $fromDebtor;
        }

        $retail = DB::table('sales_types')->where('typeName', 'Retail')->value('id');
        if ($retail) {
            return (int) $retail;
        }

        $any = DB::table('sales_types')->orderBy('id')->value('id');
        if ($any) {
            return (int) $any;
        }

        throw new \RuntimeException('No sales type (price list) found. Create one in Setup first.');
    }

    private function quantityOnHand(string $stockId, string $locCode): float
    {
        if (! Schema::hasTable('loc_stock')) {
            return 0.0;
        }

        return (float) (DB::table('loc_stock')
            ->where('stock_id', $stockId)
            ->where('loc_code', $locCode)
            ->value('quantity') ?? 0);
    }

    private function printStockSummary(string $locCode): void
    {
        $this->info("Stock at {$locCode}:");
        $codes = array_merge(self::RM_CODES, [self::FG_CODE]);
        foreach ($codes as $code) {
            $qty = $this->quantityOnHand($code, $locCode);
            $name = $code === self::FG_CODE ? self::FG_NAME : (self::RM_NAMES[$code] ?? $code);
            $this->line(sprintf('  %s — %s: %s', $code, $name, rtrim(rtrim(number_format($qty, 4, '.', ''), '0'), '.')));
        }
    }

    private function printUiWalkthrough(string $locCode): void
    {
        $this->info('UI walkthrough (standard path — no separate Issue step; produce consumes BOM):');
        $steps = [
            'Setup → Company: manufacturing enabled (done by this command).',
            'Items: RM001 Empty Bottle, RM002 Cap, RM003 Label (Purchased); FG001 Water Bottle (Manufactured).',
            "Purchase → Direct GRN: 500 each RM into {$locCode} (done unless --skip-grn).",
            'Manufacturing → BOM: FG001 = 1× RM001 + 1× RM002 + 1× RM003.',
            'Manufacturing → Work Order Entry: FG001, Advanced Manufacture, qty 100, location '.$locCode.'.',
            'Outstanding Work Orders → Release.',
            'Outstanding Work Orders → Produce qty 98 → Process and Close (auto-consumes 98 of each RM).',
            'Sales → Direct Delivery: FG001 qty 20 from '.$locCode.' (expect ~78 FG on hand after full demo).',
        ];

        if ($this->option('run-transactions')) {
            $steps[] = '(--run-transactions already executed WO → Release → Produce 98 → Sales 20.)';
        }

        foreach ($steps as $i => $step) {
            $this->line('  '.($i + 1).'. '.$step);
        }

        $this->newLine();
        $this->comment('Re-run master data only: php artisan manufacturing:water-bottle-demo');
        $this->comment('Full automated chain:      php artisan manufacturing:water-bottle-demo --run-transactions');
    }
}
