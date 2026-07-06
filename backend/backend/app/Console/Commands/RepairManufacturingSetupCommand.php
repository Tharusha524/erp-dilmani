<?php

namespace App\Console\Commands;

use App\Services\Inventory\InventoryTransactionService;
use App\Support\ItemMbFlag;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RepairManufacturingSetupCommand extends Command
{
    protected $signature = 'manufacturing:repair-setup
                            {--dry-run : Show planned changes without applying them}';

    protected $description = 'Repair purchase→manufacturing data: BOM component types, costs, stock, loc_stock sync';

    public function handle(InventoryTransactionService $inventory): int
    {
        $dryRun = (bool) $this->option('dry-run');

        if ($dryRun) {
            $this->warn('DRY RUN — no changes will be saved.');
        }

        $this->info('Fixing BOM component item types...');
        $this->fixBomComponentItemTypes($dryRun);

        $this->info('Setting component costs from purchase/GRN history...');
        $this->fixComponentCosts($dryRun);

        $this->info('Correcting negative component stock via inventory adjustment...');
        $this->fixNegativeComponentStock($inventory, $dryRun);

        $this->info('Syncing loc_stock from stock_moves...');
        $this->syncLocStock($dryRun);

        $this->info('Updating work order requirement costs...');
        $this->fixWoRequirementCosts($dryRun);

        $this->newLine();
        $this->info($dryRun ? 'Dry run complete.' : 'Manufacturing setup repair complete.');

        return self::SUCCESS;
    }

    private function fixBomComponentItemTypes(bool $dryRun): void
    {
        if (! Schema::hasTable('bom')) {
            return;
        }

        $parents = DB::table('bom')->distinct()->pluck('parent')->all();
        $components = DB::table('bom')->distinct()->pluck('component')->unique();

        foreach ($components as $componentId) {
            $item = DB::table('stock_master')->where('stock_id', $componentId)->first();
            if (! $item) {
                continue;
            }

            $mbFlag = (int) ($item->mb_flag ?? 0);
            $isSubAssembly = in_array($componentId, $parents, true);

            if ($mbFlag === ItemMbFlag::MANUFACTURED && ! $isSubAssembly) {
                $this->line("  {$componentId}: Manufactured → Purchased (leaf BOM component)");
                if (! $dryRun) {
                    DB::table('stock_master')->where('stock_id', $componentId)->update([
                        'mb_flag' => ItemMbFlag::PURCHASED,
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    private function fixComponentCosts(bool $dryRun): void
    {
        if (! Schema::hasTable('bom')) {
            return;
        }

        $components = DB::table('bom')->distinct()->pluck('component');

        foreach ($components as $stockId) {
            $item = DB::table('stock_master')->where('stock_id', $stockId)->first();
            if (! $item) {
                continue;
            }

            $cost = (float) ($item->material_cost ?? 0);
            if ($cost > 0) {
                continue;
            }

            $purchaseCost = (float) ($item->purchase_cost ?? 0);
            if ($purchaseCost > 0) {
                $cost = $purchaseCost;
            } elseif (Schema::hasTable('grn_items') && Schema::hasTable('purch_order_details')) {
                $grnCost = DB::table('grn_items as gi')
                    ->join('purch_order_details as pod', 'gi.po_detail_item', '=', 'pod.po_detail_item')
                    ->where('gi.item_code', $stockId)
                    ->where('pod.unit_price', '>', 0)
                    ->orderByDesc('gi.id')
                    ->value('pod.unit_price');
                $cost = (float) ($grnCost ?? 0);
            }

            if ($cost <= 0) {
                $cost = 100.0;
            }

            $this->line("  {$stockId}: material_cost → {$cost}");
            if (! $dryRun) {
                DB::table('stock_master')->where('stock_id', $stockId)->update([
                    'material_cost' => $cost,
                    'purchase_cost' => max((float) ($item->purchase_cost ?? 0), $cost),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function fixNegativeComponentStock(InventoryTransactionService $inventory, bool $dryRun): void
    {
        if (! Schema::hasTable('bom') || ! Schema::hasTable('stock_moves')) {
            return;
        }

        $targets = [];
        foreach (DB::table('bom')->get() as $bom) {
            $key = $bom->component.'|'.$bom->loc_code;
            $targets[$key] = ['stock_id' => $bom->component, 'loc_code' => $bom->loc_code];
        }

        foreach ($targets as $target) {
            $stockId = $target['stock_id'];
            $locCode = $target['loc_code'];

            $qoh = (float) DB::table('stock_moves')
                ->where('stock_id', $stockId)
                ->where('loc_code', $locCode)
                ->sum('qty');

            $minBuffer = 500.0;
            if ($qoh >= $minBuffer) {
                continue;
            }

            $adjustQty = round($minBuffer - $qoh, 4);
            $item = DB::table('stock_master')->where('stock_id', $stockId)->first();
            $unitCost = max(
                (float) ($item->material_cost ?? 0),
                (float) ($item->purchase_cost ?? 0),
                100.0
            );

            $this->line("  {$stockId} @ {$locCode}: on hand {$qoh}, adjusting +{$adjustQty} @ cost {$unitCost}");

            if ($dryRun) {
                continue;
            }

            $inventory->adjustment(
                [
                    'loc_code' => $locCode,
                    'trans_date' => now()->toDateString(),
                    'reference' => 'MFG-REPAIR-'.str_replace([' ', '/'], '-', $stockId),
                    'comments' => 'Opening stock repair for manufacturing BOM component',
                ],
                [
                    [
                        'stock_id' => $stockId,
                        'quantity' => $adjustQty,
                        'standard_cost' => $unitCost,
                    ],
                ]
            );
        }
    }

    private function syncLocStock(bool $dryRun): void
    {
        if (! Schema::hasTable('loc_stock') || ! Schema::hasTable('stock_moves')) {
            return;
        }

        $pairs = DB::table('stock_moves')
            ->select('stock_id', 'loc_code')
            ->distinct()
            ->get();

        foreach ($pairs as $pair) {
            $qty = round((float) DB::table('stock_moves')
                ->where('stock_id', $pair->stock_id)
                ->where('loc_code', $pair->loc_code)
                ->sum('qty'), 4);

            $existing = DB::table('loc_stock')
                ->where('stock_id', $pair->stock_id)
                ->where('loc_code', $pair->loc_code)
                ->first();

            $current = $existing ? (float) ($existing->quantity ?? 0) : null;

            if ($current !== null && abs($current - $qty) < 0.0001) {
                continue;
            }

            $this->line("  {$pair->stock_id} @ {$pair->loc_code}: loc_stock ".($current ?? 'null')." → {$qty}");

            if ($dryRun) {
                continue;
            }

            if ($existing) {
                DB::table('loc_stock')
                    ->where('stock_id', $pair->stock_id)
                    ->where('loc_code', $pair->loc_code)
                    ->update(['quantity' => $qty, 'updated_at' => now()]);
            } else {
                DB::table('loc_stock')->insert([
                    'loc_code' => $pair->loc_code,
                    'stock_id' => $pair->stock_id,
                    'reorder_level' => 0,
                    'quantity' => $qty,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function fixWoRequirementCosts(bool $dryRun): void
    {
        if (! Schema::hasTable('wo_requirements')) {
            return;
        }

        foreach (DB::table('wo_requirements')->where('unit_cost', '<=', 0)->get() as $req) {
            $cost = (float) DB::table('stock_master')
                ->where('stock_id', $req->stock_id)
                ->value('material_cost');

            if ($cost <= 0) {
                continue;
            }

            $this->line("  WO #{$req->workorder_id} req {$req->stock_id}: unit_cost → {$cost}");
            if (! $dryRun) {
                DB::table('wo_requirements')->where('id', $req->id)->update([
                    'unit_cost' => $cost,
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
