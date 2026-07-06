<?php

namespace App\Services\FixedAssets;

use App\Models\DebtorTrans;
use App\Models\FaDepreciationLine;
use App\Models\StockMaster;
use App\Models\SuppTrans;
use App\Services\Accounting\PostingsService;
use App\Support\GlTransHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class FaTransactionService
{
    public function __construct(
        private PostingsService $postings,
        private FaStockMoveService $stockMoves,
        private FaLocationSyncService $locationSync
    ) {}

    /**
     * @param  array<int, array{stock_id:string,quantity:float,price:float,description?:string}>  $lines
     */
    public function purchase(array $header, array $lines): array
    {
        return DB::transaction(function () use ($header, $lines) {
            $supplierId = (int) ($header['supplier_id'] ?? 0);
            if ($supplierId <= 0) {
                throw new InvalidArgumentException('Supplier is required.');
            }

            $locCode = trim((string) ($header['loc_code'] ?? ''));
            if ($locCode === '') {
                throw new InvalidArgumentException('Receive location (loc_code) is required.');
            }
            $this->locationSync->ensureInventoryLocation($locCode);

            $validLines = array_values(array_filter($lines, fn ($l) => ! empty($l['stock_id']) && (float) ($l['quantity'] ?? 0) > 0));
            if ($validLines === []) {
                throw new InvalidArgumentException('Add at least one fixed asset line.');
            }

            $total = round(array_sum(array_map(
                fn ($l) => (float) $l['quantity'] * (float) $l['price'],
                $validLines
            )), 2);

            $transNo = $this->nextSuppTransNo(20);
            $transDate = $header['trans_date'] ?? now()->toDateString();
            $reference = $header['reference'] ?? ('FA-PO-'.$transNo);

            $suppTrans = SuppTrans::create([
                'trans_no' => $transNo,
                'trans_type' => 20,
                'supplier_id' => $supplierId,
                'reference' => $reference,
                'supp_reference' => $header['supp_reference'] ?? '',
                'trans_date' => $transDate,
                'due_date' => $header['due_date'] ?? $transDate,
                'ov_amount' => $total,
                'ov_discount' => 0,
                'ov_gst' => 0,
                'rate' => 1,
                'alloc' => 0,
                'tax_included' => 0,
            ]);

            $stockMoveTransNo = $this->stockMoves->nextTransNo(FaStockMoveService::TYPE_INVENTORY_ADJUSTMENT);
            $stockMoves = [];

            foreach ($validLines as $line) {
                $asset = $this->requireFixedAsset($line['stock_id']);
                if (trim((string) ($asset->inventory_account ?? '')) === '') {
                    throw new InvalidArgumentException(
                        "Fixed asset {$line['stock_id']} is missing an inventory (asset) GL account."
                    );
                }
                $qty = (float) $line['quantity'];
                $lineTotal = round($qty * (float) $line['price'], 2);
                $asset->purchase_cost = round((float) $asset->purchase_cost + $lineTotal, 2);
                $asset->material_cost = max(0, round(
                    (float) $asset->purchase_cost - $this->accumulatedDepreciation((string) $line['stock_id']),
                    2
                ));
                $asset->save();

                if (Schema::hasTable('supp_invoice_items')) {
                    DB::table('supp_invoice_items')->insert([
                        'supp_trans_no' => $transNo,
                        'supp_trans_type' => 20,
                        'gl_code' => (string) ($asset->inventory_account ?? ''),
                        'stock_id' => (string) $line['stock_id'],
                        'description' => $line['description'] ?? $asset->description,
                        'quantity' => $qty,
                        'unit_price' => (float) $line['price'],
                        'unit_tax' => 0,
                        'memo' => '',
                        'dimension_id' => (int) ($header['dimension_id'] ?? 0),
                        'dimension2_id' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $stockMoves[] = $this->stockMoves->insertMove(
                    (string) $line['stock_id'],
                    $locCode,
                    $qty,
                    FaStockMoveService::TYPE_INVENTORY_ADJUSTMENT,
                    $reference,
                    $transDate,
                    $stockMoveTransNo,
                    (float) $line['price']
                );
            }

            $this->postings->postSuppInvoice($suppTrans);

            return [
                'message' => 'Fixed asset purchase posted.',
                'trans_no' => $transNo,
                'trans_type' => 20,
                'total' => $total,
                'loc_code' => $locCode,
                'stock_moves' => $stockMoves,
            ];
        });
    }

    /**
     * Record opening quantity for legacy fixed assets (no supplier invoice / GL).
     *
     * @param  array<int, array{stock_id:string,quantity:float}>  $lines
     */
    public function openingBalance(array $header, array $lines): array
    {
        return DB::transaction(function () use ($header, $lines) {
            $locCode = strtoupper(trim((string) ($header['loc_code'] ?? '')));
            if ($locCode === '') {
                throw new InvalidArgumentException('Location is required.');
            }
            $this->locationSync->ensureInventoryLocation($locCode);

            $validLines = array_values(array_filter($lines, fn ($l) => ! empty($l['stock_id']) && (float) ($l['quantity'] ?? 0) > 0));
            if ($validLines === []) {
                throw new InvalidArgumentException('Add at least one line with quantity greater than 0.');
            }

            $transDate = $header['trans_date'] ?? now()->toDateString();
            $reference = trim((string) ($header['reference'] ?? ''));
            $transNo = $this->stockMoves->nextTransNo(FaStockMoveService::TYPE_INVENTORY_ADJUSTMENT);
            if ($reference === '') {
                $reference = 'OPN-'.sprintf('%03d/%s', $transNo, date('Y', strtotime($transDate)));
            }

            $moves = [];
            foreach ($validLines as $line) {
                $stockId = (string) $line['stock_id'];
                $qty = (float) $line['quantity'];
                $this->requireFixedAsset($stockId);

                $existing = $this->stockMoves->quantityOnHand($stockId, $locCode);
                if ($existing > 0.0001) {
                    throw new InvalidArgumentException(
                        "{$stockId} already has quantity on hand ({$existing}) at {$locCode}. Use transfer instead."
                    );
                }

                $moves[] = $this->stockMoves->insertMove(
                    $stockId,
                    $locCode,
                    $qty,
                    FaStockMoveService::TYPE_INVENTORY_ADJUSTMENT,
                    $reference,
                    $transDate,
                    $transNo
                );
            }

            return [
                'message' => 'Fixed asset opening quantity recorded.',
                'trans_no' => $transNo,
                'trans_type' => FaStockMoveService::TYPE_INVENTORY_ADJUSTMENT,
                'reference' => $reference,
                'loc_code' => $locCode,
                'stock_moves' => $moves,
            ];
        });
    }

    /**
     * @param  array<int, array{stock_id:string,quantity:float}>  $lines
     */
    public function transfer(array $header, array $lines): array
    {
        return DB::transaction(function () use ($header, $lines) {
            $fromLoc = strtoupper(trim((string) ($header['from_loc_code'] ?? '')));
            $toLoc = strtoupper(trim((string) ($header['to_loc_code'] ?? '')));
            if ($fromLoc === '' || $toLoc === '') {
                throw new InvalidArgumentException('From and to locations are required.');
            }
            if ($fromLoc === $toLoc) {
                throw new InvalidArgumentException('From and to locations cannot be the same.');
            }

            $this->locationSync->ensureInventoryLocation($fromLoc);
            $this->locationSync->ensureInventoryLocation($toLoc);

            $validLines = array_values(array_filter($lines, fn ($l) => ! empty($l['stock_id']) && (float) ($l['quantity'] ?? 0) > 0));
            if ($validLines === []) {
                throw new InvalidArgumentException('Add at least one line with quantity greater than 0.');
            }

            $transDate = $header['trans_date'] ?? now()->toDateString();
            $reference = trim((string) ($header['reference'] ?? ''));
            $transNo = $this->stockMoves->nextTransNo(FaStockMoveService::TYPE_LOCATION_TRANSFER);
            if ($reference === '') {
                $reference = sprintf('%03d/%s', $transNo, date('Y', strtotime($transDate)));
            }

            $moves = [];
            foreach ($validLines as $line) {
                $stockId = (string) $line['stock_id'];
                $qty = (float) $line['quantity'];
                $this->requireFixedAsset($stockId);

                $qoh = $this->stockMoves->quantityOnHand($stockId, $fromLoc);
                if ($qty > $qoh + 0.0001) {
                    throw new InvalidArgumentException("Insufficient quantity on hand for {$stockId} at {$fromLoc}. Available: {$qoh}");
                }

                $moves[] = $this->stockMoves->insertMove(
                    $stockId,
                    $fromLoc,
                    -$qty,
                    FaStockMoveService::TYPE_LOCATION_TRANSFER,
                    $reference,
                    $transDate,
                    $transNo
                );
                $moves[] = $this->stockMoves->insertMove(
                    $stockId,
                    $toLoc,
                    $qty,
                    FaStockMoveService::TYPE_LOCATION_TRANSFER,
                    $reference,
                    $transDate,
                    $transNo
                );
            }

            return [
                'message' => 'Fixed asset location transfer posted.',
                'trans_no' => $transNo,
                'trans_type' => FaStockMoveService::TYPE_LOCATION_TRANSFER,
                'reference' => $reference,
                'stock_moves' => $moves,
            ];
        });
    }

    /**
     * @param  array<int, array{stock_id:string,quantity:float}>  $lines
     */
    public function disposal(array $header, array $lines): array
    {
        return DB::transaction(function () use ($header, $lines) {
            $locCode = strtoupper(trim((string) ($header['loc_code'] ?? '')));
            if ($locCode === '') {
                throw new InvalidArgumentException('Location is required.');
            }
            $this->locationSync->ensureInventoryLocation($locCode);

            $validLines = array_values(array_filter($lines, fn ($l) => ! empty($l['stock_id']) && (float) ($l['quantity'] ?? 0) > 0));
            if ($validLines === []) {
                throw new InvalidArgumentException('Add at least one line with quantity greater than 0.');
            }

            $transDate = $header['trans_date'] ?? now()->toDateString();
            $reference = trim((string) ($header['reference'] ?? ''));
            $transNo = $this->stockMoves->nextTransNo(FaStockMoveService::TYPE_INVENTORY_ADJUSTMENT);
            if ($reference === '') {
                $reference = sprintf('%03d/%s', $transNo, date('Y', strtotime($transDate)));
            }

            $moves = [];
            $totalBookValue = 0.0;

            foreach ($validLines as $line) {
                $stockId = (string) $line['stock_id'];
                $qty = (float) $line['quantity'];
                $asset = $this->requireFixedAsset($stockId);

                $qoh = $this->stockMoves->quantityOnHand($stockId, $locCode);
                if ($qty > $qoh + 0.0001) {
                    throw new InvalidArgumentException("Insufficient quantity on hand for {$stockId}. Available: {$qoh}");
                }

                $totalQoh = $this->totalQuantityOnHand($stockId);
                $lineGross = $this->prorateAssetAmount($this->grossAssetCost($asset), $qty, $totalQoh);
                $lineBook = $this->prorateAssetAmount($this->bookValue($asset), $qty, $totalQoh);
                $totalBookValue += $lineBook;

                $moves[] = $this->stockMoves->insertMove(
                    $stockId,
                    $locCode,
                    -$qty,
                    FaStockMoveService::TYPE_INVENTORY_ADJUSTMENT,
                    $reference,
                    $transDate,
                    $transNo
                );

                $this->postFaWriteOffGl($asset, $transNo, $reference, $transDate, $lineGross, $lineBook);

                $asset->material_cost = max(0, round((float) $asset->material_cost - $lineBook, 2));
                $asset->save();

                if ($this->totalQuantityOnHand($stockId) <= 0.0001) {
                    $asset->inactive = 1;
                    $asset->save();
                }
            }

            return [
                'message' => 'Fixed asset disposal posted.',
                'trans_no' => $transNo,
                'trans_type' => FaStockMoveService::TYPE_INVENTORY_ADJUSTMENT,
                'reference' => $reference,
                'book_value_removed' => round($totalBookValue, 2),
                'stock_moves' => $moves,
            ];
        });
    }

    /**
     * @param  array<int, array{stock_id:string,quantity:float,price:float}>  $lines
     */
    public function sale(array $header, array $lines): array
    {
        return DB::transaction(function () use ($header, $lines) {
            $debtorNo = (int) ($header['debtor_no'] ?? 0);
            $branchCode = (int) ($header['branch_code'] ?? 0);
            if ($debtorNo <= 0) {
                throw new InvalidArgumentException('Customer is required.');
            }

            $defaultLoc = strtoupper(trim((string) ($header['loc_code'] ?? '')));

            $validLines = array_values(array_filter($lines, fn ($l) => ! empty($l['stock_id']) && (float) ($l['quantity'] ?? 0) > 0));
            if ($validLines === []) {
                throw new InvalidArgumentException('Add at least one fixed asset line.');
            }

            $total = round(array_sum(array_map(
                fn ($l) => (float) $l['quantity'] * (float) $l['price'],
                $validLines
            )), 2);

            $tranDate = $header['tran_date'] ?? now()->toDateString();
            $deliveryRef = trim((string) ($header['reference'] ?? ''));
            $deliveryNo = $this->nextDebtorTransNo(FaStockMoveService::TYPE_SALES_DELIVERY);
            if ($deliveryRef === '') {
                $deliveryRef = sprintf('%03d/%s', $deliveryNo, date('Y', strtotime($tranDate)));
            }

            $invoiceNo = $this->nextDebtorTransNo(10);
            $invoiceRef = trim((string) ($header['invoice_reference'] ?? ''));
            if ($invoiceRef === '') {
                $invoiceRef = 'FA-SALE-'.$invoiceNo;
            }

            $deliveryTrans = DebtorTrans::create([
                'trans_no' => $deliveryNo,
                'trans_type' => FaStockMoveService::TYPE_SALES_DELIVERY,
                'debtor_no' => $debtorNo,
                'branch_code' => $branchCode,
                'tran_date' => $tranDate,
                'due_date' => $header['due_date'] ?? $tranDate,
                'reference' => $deliveryRef,
                'ov_amount' => 0,
                'ov_gst' => 0,
                'ov_freight' => 0,
                'ov_freight_tax' => 0,
                'ov_discount' => 0,
                'alloc' => 0,
                'dimension_id' => (int) ($header['dimension_id'] ?? 0),
            ]);

            $invoiceTrans = DebtorTrans::create([
                'trans_no' => $invoiceNo,
                'trans_type' => 10,
                'debtor_no' => $debtorNo,
                'branch_code' => $branchCode,
                'tran_date' => $tranDate,
                'due_date' => $header['due_date'] ?? $tranDate,
                'reference' => $invoiceRef,
                'ov_amount' => $total,
                'ov_gst' => 0,
                'ov_freight' => 0,
                'ov_freight_tax' => 0,
                'ov_discount' => 0,
                'alloc' => 0,
                'dimension_id' => (int) ($header['dimension_id'] ?? 0),
            ]);

            $stockMoves = [];
            $detailId = 1;

            foreach ($validLines as $line) {
                $stockId = (string) $line['stock_id'];
                $qty = (float) $line['quantity'];
                $unitPrice = (float) $line['price'];
                $locCode = strtoupper(trim((string) ($line['loc_code'] ?? $defaultLoc)));
                if ($locCode === '') {
                    throw new InvalidArgumentException("Location is required for fixed asset {$stockId}.");
                }
                $this->locationSync->ensureInventoryLocation($locCode);

                $asset = $this->requireFixedAsset($stockId);
                $qoh = $this->stockMoves->quantityOnHand($stockId, $locCode);
                if ($qty > $qoh + 0.0001) {
                    throw new InvalidArgumentException("Insufficient quantity on hand for {$stockId} at {$locCode}. Available: {$qoh}");
                }

                $totalQoh = $this->totalQuantityOnHand($stockId);
                $unitBook = $totalQoh > 0.0001
                    ? round($this->bookValue($asset) / $totalQoh, 4)
                    : $this->bookValue($asset);
                $lineBook = $this->prorateAssetAmount($this->bookValue($asset), $qty, $totalQoh);

                $detailRow = [
                    'stock_id' => $stockId,
                    'description' => $line['description'] ?? $asset->description,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'unit_tax' => 0,
                    'discount_percent' => 0,
                    'standard_cost' => $unitBook,
                    'qty_done' => 0,
                    'src_id' => $detailId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                DB::table('debtor_trans_details')->insert(array_merge($detailRow, [
                    'debtor_trans_no' => $deliveryNo,
                    'debtor_trans_type' => FaStockMoveService::TYPE_SALES_DELIVERY,
                ]));

                DB::table('debtor_trans_details')->insert(array_merge($detailRow, [
                    'debtor_trans_no' => $invoiceNo,
                    'debtor_trans_type' => 10,
                ]));

                $stockMoves[] = $this->stockMoves->insertMove(
                    $stockId,
                    $locCode,
                    -$qty,
                    FaStockMoveService::TYPE_SALES_DELIVERY,
                    $deliveryRef,
                    $tranDate,
                    $deliveryNo,
                    $unitBook
                );

                $asset->material_cost = max(0, round((float) $asset->material_cost - $lineBook, 2));
                if ($this->totalQuantityOnHand($stockId) <= 0.0001) {
                    $asset->inactive = 1;
                }
                $asset->save();

                $detailId++;
            }

            $this->postings->postDebtorDelivery($deliveryTrans);
            $this->postings->postDebtorInvoice($invoiceTrans);

            return [
                'message' => 'Fixed asset sale posted.',
                'delivery_trans_no' => $deliveryNo,
                'delivery_trans_type' => FaStockMoveService::TYPE_SALES_DELIVERY,
                'delivery_reference' => $deliveryRef,
                'invoice_trans_no' => $invoiceNo,
                'invoice_trans_type' => 10,
                'invoice_reference' => $invoiceRef,
                'total' => $total,
                'stock_moves' => $stockMoves,
            ];
        });
    }

    private function requireFixedAsset(string $stockId): StockMaster
    {
        $asset = StockMaster::query()->where('stock_id', $stockId)->first();
        if (! $asset || (int) $asset->mb_flag !== FaDepreciationService::FA_MB_FLAG) {
            throw new InvalidArgumentException("Item {$stockId} is not a fixed asset.");
        }

        return $asset;
    }

    private function grossAssetCost(StockMaster $asset): float
    {
        $purchase = (float) $asset->purchase_cost;
        if ($purchase > 0.001) {
            return round($purchase, 2);
        }

        return round((float) $asset->material_cost, 2);
    }

    private function accumulatedDepreciation(string $stockId): float
    {
        if (! Schema::hasTable('fa_depreciation_lines')) {
            return 0;
        }

        return (float) FaDepreciationLine::query()->where('stock_id', $stockId)->sum('amount');
    }

    private function bookValue(StockMaster $asset): float
    {
        return max(0, round($this->grossAssetCost($asset) - $this->accumulatedDepreciation($asset->stock_id), 2));
    }

    private function prorateAssetAmount(float $totalAmount, float $qty, float $totalQoh): float
    {
        if ($totalAmount <= 0.001 || $qty <= 0.001) {
            return 0;
        }

        if ($totalQoh <= 0.001) {
            return round($totalAmount, 2);
        }

        return round($totalAmount * ($qty / $totalQoh), 2);
    }

    private function totalQuantityOnHand(string $stockId): float
    {
        if (! Schema::hasTable('stock_moves')) {
            return 0;
        }

        $stockColumn = Schema::hasColumn('stock_moves', 'stock_id') ? 'stock_id' : 'item_code';
        $qtyColumn = Schema::hasColumn('stock_moves', 'qty') ? 'qty' : 'quantity';

        return (float) DB::table('stock_moves')->where($stockColumn, $stockId)->sum($qtyColumn);
    }

    private function postFaWriteOffGl(
        StockMaster $asset,
        int $transNo,
        string $reference,
        string $date,
        float $grossCost,
        float $bookValue
    ): void {
        $grossCost = round($grossCost, 2);
        $bookValue = round($bookValue, 2);
        if ($grossCost <= 0.001 && $bookValue <= 0.001) {
            return;
        }

        $assetAccount = (string) ($asset->inventory_account ?: '');
        $accumAccount = (string) ($asset->adjustment_account
            ?: DB::table('sys_prefs')->where('name', 'cogsAccount')->value('value'));
        $lossAccount = (string) (DB::table('sys_prefs')->where('name', 'lossOnAssetDisposalAccount')->value('value')
            ?: $asset->cogs_account
            ?: DB::table('sys_prefs')->where('name', 'cogsAccount')->value('value'));

        if ($assetAccount === '' || $lossAccount === '') {
            return;
        }

        if (GlTransHelper::hasMemoPrefix(FaStockMoveService::TYPE_INVENTORY_ADJUSTMENT, $transNo, 'FA disposal — '.$asset->stock_id)) {
            return;
        }

        $accumulated = max(0, round($grossCost - $bookValue, 2));
        $lines = [];

        if ($accumulated > 0.001 && $accumAccount !== '') {
            $lines[] = [
                'type' => FaStockMoveService::TYPE_INVENTORY_ADJUSTMENT,
                'type_no' => $transNo,
                'reference' => $reference,
                'date' => $date,
                'account' => $accumAccount,
                'debit' => $accumulated,
                'credit' => 0,
                'memo' => 'FA disposal — '.$asset->stock_id.' accum dep',
            ];
        }

        if ($bookValue > 0.001) {
            $lines[] = [
                'type' => FaStockMoveService::TYPE_INVENTORY_ADJUSTMENT,
                'type_no' => $transNo,
                'reference' => $reference,
                'date' => $date,
                'account' => $lossAccount,
                'debit' => $bookValue,
                'credit' => 0,
                'memo' => 'FA disposal — '.$asset->stock_id,
            ];
        }

        if ($grossCost > 0.001) {
            $lines[] = [
                'type' => FaStockMoveService::TYPE_INVENTORY_ADJUSTMENT,
                'type_no' => $transNo,
                'reference' => $reference,
                'date' => $date,
                'account' => $assetAccount,
                'debit' => 0,
                'credit' => $grossCost,
                'memo' => 'FA disposal — '.$asset->stock_id.' asset',
            ];
        }

        if ($lines !== []) {
            GlTransHelper::insertLines($lines);
        }
    }

    private function nextSuppTransNo(int $type): int
    {
        $max = SuppTrans::query()->where('trans_type', $type)->max('trans_no');

        return ((int) $max) + 1;
    }

    private function nextDebtorTransNo(int $type): int
    {
        $max = DebtorTrans::query()->where('trans_type', $type)->max('trans_no');

        return ((int) $max) + 1;
    }
}
