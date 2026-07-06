<?php

namespace App\Services\Manufacturing;

use App\Models\WorkOrder;
use App\Services\Accounting\PostingsService;
use App\Services\Banking\BankingTransactionService;
use App\Services\FiscalYear\TransactionReferenceService;
use App\Services\Inventory\LocStockQuantityService;
use App\Services\Inventory\StockMoveWriter;
use App\Support\ActiveFiscalYear;
use App\Support\CompanySetupSettings;
use App\Support\GlPostingRunner;
use App\Support\ItemMbFlag;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

/**
 * FrontAccounting manufacturing — atomic work order entry, issue, produce, and cost posting.
 */
class ManufacturingPostingService
{
    public const TYPE_WORKORDER = 26;

    public const TYPE_WO_ISSUE = 28;

    public const TYPE_WO_PRODUCTION = 29;

    public const TYPE_JOURNAL = 0;

    public const WO_ASSEMBLE = 0;

    public const WO_UNASSEMBLE = 1;

    public const WO_ADVANCED = 2;

    public const COST_LABOUR = 0;

    public const COST_OVERHEAD = 1;

    public function __construct(
        private PostingsService $postings,
        private TransactionReferenceService $references,
        private StockMoveWriter $stockMoves,
        private LocStockQuantityService $locStockQty,
        private BankingTransactionService $banking,
        private ManufacturingReorderNotificationService $reorderNotify,
    ) {}

    /**
     * Create work order. Assemble/unassemble auto-release, cost, and produce in one transaction.
     *
     * @param  array{
     *     wo_ref:string,
     *     loc_code:string,
     *     units_reqd:float,
     *     stock_id:string,
     *     date?:string,
     *     type:int,
     *     required_by?:string,
     *     memo?:string,
     *     labour_cost?:float,
     *     labour_credit_account?:string,
     *     overhead_cost?:float,
     *     overhead_credit_account?:string
     * }  $payload
     */
    public function createWorkOrder(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $type = (int) ($payload['type'] ?? self::WO_ASSEMBLE);
            $unitsReqd = (float) ($payload['units_reqd'] ?? 0);
            if ($unitsReqd <= 0) {
                throw new InvalidArgumentException('Quantity required must be greater than zero.');
            }

            $produceQty = abs((float) ($payload['units_reqd'] ?? 0));

            if ($type === self::WO_UNASSEMBLE) {
                $this->assertSufficientStock(
                    (string) ($payload['stock_id'] ?? ''),
                    (string) ($payload['loc_code'] ?? ''),
                    $produceQty
                );
            }

            $date = (string) ($payload['date'] ?? now()->toDateString());
            $requiredBy = (string) ($payload['required_by'] ?? ($type === self::WO_ADVANCED ? $date : $date));

            $woId = (int) DB::table('workorders')->insertGetId([
                'wo_ref' => (string) $payload['wo_ref'],
                'loc_code' => (string) $payload['loc_code'],
                'units_reqd' => abs((float) ($payload['units_reqd'] ?? 0)),
                'stock_id' => (string) $payload['stock_id'],
                'date' => $date,
                'type' => $type,
                'required_by' => $requiredBy,
                'released_date' => null,
                'units_issued' => 0,
                'closed' => false,
                'released' => false,
                'additional_costs' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->addComment(self::TYPE_WORKORDER, $woId, $date, (string) ($payload['memo'] ?? ''));
            $this->addAuditTrail(self::TYPE_WORKORDER, $woId, $date, '');

            if ($type === self::WO_ADVANCED) {
                return $this->workOrderResponse($woId);
            }

            $this->releaseWorkOrderInternal($woId, $date, (string) ($payload['memo'] ?? ''));

            $this->postOptionalCosts($woId, $payload, $date, (string) $payload['wo_ref']);

            $production = $this->produceInternal(
                $woId,
                $produceQty,
                $date,
                (string) ($payload['wo_ref'] ?? ''),
                true,
                (string) ($payload['memo'] ?? ''),
                $type === self::WO_UNASSEMBLE
            );

            return array_merge($this->workOrderResponse($woId), [
                'production' => $production,
            ]);
        });
    }

    /**
     * Release advanced work order and expand BOM into requirements.
     */
    public function releaseWorkOrder(int $workOrderId, array $payload): array
    {
        return DB::transaction(function () use ($workOrderId, $payload) {
            $wo = $this->requireWorkOrder($workOrderId);
            if ((bool) ($wo->released ?? false)) {
                throw new InvalidArgumentException('Work order is already released.');
            }

            $date = (string) ($payload['released_date'] ?? now()->toDateString());
            $this->releaseWorkOrderInternal($workOrderId, $date, (string) ($payload['memo'] ?? ''));
            $this->addComment(self::TYPE_WORKORDER, $workOrderId, $date, (string) ($payload['memo'] ?? ''));

            return $this->workOrderResponse($workOrderId);
        });
    }

    /**
     * Issue additional materials to a work order (type 28).
     *
     * @param  array{
     *     workorder_id:int,
     *     reference?:string,
     *     issue_date:string,
     *     loc_code:string,
     *     work_centre?:int|null,
     *     memo?:string,
     *     return_to_inventory?:bool,
     *     lines: array<int, array{stock_id:string, quantity:float, unit_cost?:float}>
     * }  $payload
     */
    public function issueMaterials(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $workOrderId = (int) ($payload['workorder_id'] ?? 0);
            $wo = $this->requireWorkOrder($workOrderId);
            if ((bool) ($wo->closed ?? false)) {
                throw new InvalidArgumentException('Cannot issue materials to a closed work order.');
            }

            $lines = $payload['lines'] ?? [];
            if ($lines === []) {
                throw new InvalidArgumentException('At least one issue line is required.');
            }

            $issueDate = (string) ($payload['issue_date'] ?? now()->toDateString());
            $locCode = (string) ($payload['loc_code'] ?? $wo->loc_code ?? '');
            $reference = trim((string) ($payload['reference'] ?? ''));
            if ($reference === '') {
                $refData = $this->references->next(self::TYPE_WO_ISSUE, $issueDate);
                $reference = (string) ($refData['reference'] ?? 'WO-ISSUE-'.$workOrderId);
            }

            $issueNo = $this->nextIssueNo();
            DB::table('wo_issues')->insert([
                'issue_no' => $issueNo,
                'workorder_id' => $workOrderId,
                'reference' => $reference,
                'issue_date' => $issueDate,
                'loc_code' => $locCode,
                'work_centre' => $payload['work_centre'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $returnToInventory = (bool) ($payload['return_to_inventory'] ?? false);
            $sign = $returnToInventory ? 1 : -1;

            foreach ($lines as $line) {
                $stockId = (string) ($line['stock_id'] ?? '');
                $qty = abs((float) ($line['quantity'] ?? 0));
                if ($stockId === '' || $qty <= 0) {
                    continue;
                }

                $unitCost = (float) ($line['unit_cost'] ?? 0);
                if ($unitCost <= 0) {
                    $unitCost = $this->stockMaterialCost($stockId, $locCode);
                }

                if (! $returnToInventory && ! $this->isServiceItem($stockId)) {
                    $this->assertSufficientStock($stockId, $locCode, $qty);
                    $this->assertComponentHasCost($stockId, $locCode, $unitCost);
                }

                DB::table('wo_issue_items')->insert([
                    'stock_id' => $stockId,
                    'issue_id' => $issueNo,
                    'qty_issued' => $returnToInventory ? -$qty : $qty,
                    'unit_cost' => $unitCost,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                if (! $this->isServiceItem($stockId)) {
                    $move = $this->stockMoves->insert(
                        $stockId,
                        $locCode,
                        $sign * $qty,
                        self::TYPE_WO_ISSUE,
                        $reference,
                        $issueDate,
                        $issueNo,
                        $unitCost
                    );
                    $this->locStockQty->applyStockMoveRecord($move);
                }
            }

            $glWarning = $this->postIssueGl($issueNo);
            $this->addComment(self::TYPE_WO_ISSUE, $issueNo, $issueDate, (string) ($payload['memo'] ?? ''));
            $this->addAuditTrail(self::TYPE_WO_ISSUE, $issueNo, $issueDate, '');

            return GlPostingRunner::mergeWarning([
                'issue_no' => $issueNo,
                'reference' => $reference,
                'workorder_id' => $workOrderId,
            ], $glWarning);
        });
    }

    /**
     * Produce finished goods from a work order (type 29), optionally close.
     *
     * @param  array{
     *     workorder_id:int,
     *     reference?:string,
     *     quantity:float,
     *     date:string,
     *     memo?:string,
     *     close?:bool
     * }  $payload
     */
    public function produce(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $workOrderId = (int) ($payload['workorder_id'] ?? 0);
            $quantity = abs((float) ($payload['quantity'] ?? 0));
            if ($quantity <= 0) {
                throw new InvalidArgumentException('Production quantity must be greater than zero.');
            }

            $date = (string) ($payload['date'] ?? now()->toDateString());
            $reference = trim((string) ($payload['reference'] ?? ''));
            if ($reference === '') {
                $refData = $this->references->next(self::TYPE_WO_PRODUCTION, $date);
                $reference = (string) ($refData['reference'] ?? 'WO-PROD-'.$workOrderId);
            }

            $wo = $this->requireWorkOrder($workOrderId);

            return $this->produceInternal(
                $workOrderId,
                $quantity,
                $date,
                $reference,
                (bool) ($payload['close'] ?? false),
                (string) ($payload['memo'] ?? ''),
                (int) ($wo->type ?? 0) === self::WO_UNASSEMBLE
            );
        });
    }

    /**
     * Post labour or overhead cost journal linked to a work order.
     *
     * @param  array{
     *     workorder_id:int,
     *     reference?:string,
     *     date:string,
     *     amount:float,
     *     cost_type?:int,
     *     credit_account:string,
     *     memo?:string
     * }  $payload
     */
    public function postAdditionalCost(array $payload): array
    {
        return DB::transaction(fn () => $this->postAdditionalCostInternal($payload));
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function postAdditionalCostInternal(array $payload): array
    {
        $workOrderId = (int) ($payload['workorder_id'] ?? 0);
        $wo = $this->requireWorkOrder($workOrderId);
        if ((bool) ($wo->closed ?? false)) {
            throw new InvalidArgumentException('Cannot post costs to a closed work order.');
        }

        $amount = round((float) ($payload['amount'] ?? 0), 2);
        if ($amount <= 0) {
            throw new InvalidArgumentException('Cost amount must be greater than zero.');
        }

        $creditAccount = trim((string) ($payload['credit_account'] ?? ''));
        if ($creditAccount === '') {
            throw new InvalidArgumentException('Credit account is required.');
        }

        $date = (string) ($payload['date'] ?? now()->toDateString());
        $reference = trim((string) ($payload['reference'] ?? ''));
        if ($reference === '') {
            $refData = $this->references->next(self::TYPE_JOURNAL, $date);
            $reference = (string) ($refData['reference'] ?? 'WO-COST-'.$workOrderId);
        }

        $costType = (int) ($payload['cost_type'] ?? self::COST_OVERHEAD);
        $transNo = $this->nextJournalTransNo();
        $currency = CompanySetupSettings::resolveCurrency(null);

        DB::table('journal')->insert([
            'type' => self::TYPE_JOURNAL,
            'trans_no' => $transNo,
            'tran_date' => $date,
            'reference' => $reference,
            'source_ref' => null,
            'event_date' => $date,
            'doc_date' => $date,
            'currency' => $currency,
            'amount' => $amount,
            'rate' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('wo_costing')->insert([
            'workorder_id' => $workOrderId,
            'cost_type' => $costType,
            'trans_type' => self::TYPE_JOURNAL,
            'trans_no' => $transNo,
            'factor' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $glWarning = GlPostingRunner::run(fn () => $this->postings->postWoCostJournal(
            $transNo,
            $workOrderId,
            $amount,
            $creditAccount,
            $date,
            $reference,
            $costType
        ))['gl_warning'];

        $this->banking->syncJournalBankTransactionsFromGlLines(
            $transNo,
            $reference,
            $date,
            $this->postings->workOrderCostJournalGlLines($workOrderId, $amount, $creditAccount, $costType)
        );

        DB::table('workorders')->where('id', $workOrderId)->update([
            'additional_costs' => round((float) ($wo->additional_costs ?? 0) + $amount, 2),
            'updated_at' => now(),
        ]);

        $this->addComment(self::TYPE_JOURNAL, $transNo, $date, (string) ($payload['memo'] ?? ''));
        $this->addAuditTrail(self::TYPE_JOURNAL, $transNo, $date, '');

        return GlPostingRunner::mergeWarning([
            'trans_no' => $transNo,
            'trans_type' => self::TYPE_JOURNAL,
            'reference' => $reference,
            'workorder_id' => $workOrderId,
            'amount' => $amount,
        ], $glWarning);
    }

    public function voidIssue(int $issueNo, ?string $memo = null): array
    {
        return DB::transaction(function () use ($issueNo, $memo) {
            $issue = DB::table('wo_issues')->where('issue_no', $issueNo)->first();
            if (! $issue) {
                throw new InvalidArgumentException('Work order issue not found.');
            }

            $wo = DB::table('workorders')->where('id', (int) $issue->workorder_id)->first();
            if ($wo && (bool) ($wo->closed ?? false)) {
                throw new InvalidArgumentException('Cannot void issue on a closed work order.');
            }

            if (Schema::hasTable('stock_moves')) {
                foreach (DB::table('stock_moves')->where('type', self::TYPE_WO_ISSUE)->where('trans_no', $issueNo)->get() as $move) {
                    $this->locStockQty->applyMoveDelta(
                        (string) ($move->stock_id ?? ''),
                        (string) ($move->loc_code ?? ''),
                        -1 * (float) ($move->qty ?? 0)
                    );
                }
                DB::table('stock_moves')->where('type', self::TYPE_WO_ISSUE)->where('trans_no', $issueNo)->delete();
            }

            DB::table('wo_issue_items')->where('issue_id', $issueNo)->update(['qty_issued' => 0]);
            $this->postings->deletePostedGl(self::TYPE_WO_ISSUE, $issueNo);
            DB::table('wo_issues')->where('issue_no', $issueNo)->delete();

            return ['message' => 'Work order issue voided.', 'issue_no' => $issueNo, 'memo' => $memo];
        });
    }

    public function voidProduction(int $manufactureId, ?string $memo = null): array
    {
        return DB::transaction(function () use ($manufactureId, $memo) {
            $manufacture = DB::table('wo_manufacture')->where('id', $manufactureId)->first();
            if (! $manufacture) {
                throw new InvalidArgumentException('Work order production not found.');
            }

            $workOrderId = (int) ($manufacture->workorder_id ?? 0);
            $wo = DB::table('workorders')->where('id', $workOrderId)->first();
            if ($wo && (bool) ($wo->closed ?? false)) {
                throw new InvalidArgumentException('Cannot void production on a closed work order.');
            }

            $qty = (float) ($manufacture->quantity ?? 0);
            $this->reverseRequirementIssued($workOrderId, $qty, (string) ($wo->stock_id ?? ''));

            if (Schema::hasTable('stock_moves')) {
                foreach (DB::table('stock_moves')->where('type', self::TYPE_WO_PRODUCTION)->where('trans_no', $manufactureId)->get() as $move) {
                    $this->locStockQty->applyMoveDelta(
                        (string) ($move->stock_id ?? ''),
                        (string) ($move->loc_code ?? ''),
                        -1 * (float) ($move->qty ?? 0)
                    );
                }
                DB::table('stock_moves')->where('type', self::TYPE_WO_PRODUCTION)->where('trans_no', $manufactureId)->delete();
            }

            DB::table('workorders')->where('id', $workOrderId)->update([
                'units_issued' => max(0, (float) ($wo->units_issued ?? 0) - $qty),
                'closed' => false,
                'updated_at' => now(),
            ]);

            $this->postings->deletePostedGl(self::TYPE_WO_PRODUCTION, $manufactureId);
            DB::table('wo_manufacture')->where('id', $manufactureId)->update(['quantity' => 0]);

            return ['message' => 'Work order production voided.', 'manufacture_id' => $manufactureId, 'memo' => $memo];
        });
    }

    public function voidWorkOrder(int $workOrderId, ?string $memo = null): array
    {
        return DB::transaction(function () use ($workOrderId, $memo) {
            $wo = $this->requireWorkOrder($workOrderId);

            if ((bool) ($wo->closed ?? false)) {
                $this->postings->deletePostedGl(self::TYPE_WORKORDER, $workOrderId);
                if (Schema::hasTable('stock_moves')) {
                    foreach (DB::table('stock_moves')->where('type', self::TYPE_WORKORDER)->where('trans_no', $workOrderId)->get() as $move) {
                        $this->locStockQty->applyMoveDelta(
                            (string) ($move->stock_id ?? ''),
                            (string) ($move->loc_code ?? ''),
                            -1 * (float) ($move->qty ?? 0)
                        );
                    }
                    DB::table('stock_moves')->where('type', self::TYPE_WORKORDER)->where('trans_no', $workOrderId)->delete();
                }
            }

            foreach (DB::table('wo_manufacture')->where('workorder_id', $workOrderId)->where('quantity', '>', 0)->get() as $prod) {
                $this->voidProduction((int) $prod->id, $memo);
            }

            foreach (DB::table('wo_issues')->where('workorder_id', $workOrderId)->get() as $issue) {
                $this->voidIssue((int) $issue->issue_no, $memo);
            }

            if (Schema::hasTable('wo_costing')) {
                foreach (DB::table('wo_costing')->where('workorder_id', $workOrderId)->get() as $cost) {
                    $this->postings->deletePostedGl((int) $cost->trans_type, (int) $cost->trans_no);
                }
                DB::table('wo_costing')->where('workorder_id', $workOrderId)->delete();
            }

            DB::table('wo_requirements')->where('workorder_id', $workOrderId)->update(['units_issued' => 0]);
            DB::table('workorders')->where('id', $workOrderId)->update([
                'closed' => true,
                'units_reqd' => 0,
                'units_issued' => 0,
                'updated_at' => now(),
            ]);

            return ['message' => 'Work order voided.', 'workorder_id' => $workOrderId, 'memo' => $memo];
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function produceInternal(
        int $workOrderId,
        float $quantity,
        string $date,
        string $reference,
        bool $forceClose,
        string $memo,
        bool $isUnassemble = false
    ): array {
        $wo = $this->requireWorkOrder($workOrderId);
        if (! (bool) ($wo->released ?? false)) {
            throw new InvalidArgumentException('Work order must be released before production.');
        }
        if ((bool) ($wo->closed ?? false)) {
            throw new InvalidArgumentException('Work order is already closed.');
        }

        $signedQty = $isUnassemble ? -abs($quantity) : abs($quantity);
        $unitsBefore = (float) ($wo->units_issued ?? 0);

        $manufactureId = (int) DB::table('wo_manufacture')->insertGetId([
            'reference' => $reference,
            'workorder_id' => $workOrderId,
            'quantity' => $signedQty,
            'date' => $date,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $consumeResult = $this->consumeComponents($wo, $workOrderId, abs($quantity), $manufactureId, $date, $isUnassemble);
        $components = $consumeResult['components'];

        $glWarning = GlPostingRunner::run(
            fn () => $this->postings->postWoProductionReceive($manufactureId, $components, $isUnassemble)
        )['gl_warning'];

        if (! $isUnassemble) {
            $this->reorderNotify->notifyAfterProduction($consumeResult['consumptions']);
        }

        if (($glWarning === null || $glWarning === '') && $components === [] && ! $isUnassemble) {
            $hasConsumption = DB::table('wo_requirements')
                ->where('workorder_id', $workOrderId)
                ->where('units_issued', '>', 0)
                ->exists();
            if ($hasConsumption) {
                $glWarning = 'Component material costs are zero, so production inventory GL was not posted. Set material cost on BOM components or receive stock via GRN first.';
            }
        }

        $newIssued = $unitsBefore + $signedQty;
        $unitsReqd = (float) ($wo->units_reqd ?? 0);
        $shouldClose = $forceClose || ($unitsReqd > 0 && abs($newIssued) >= $unitsReqd - 0.0001);

        DB::table('workorders')->where('id', $workOrderId)->update([
            'units_issued' => $newIssued,
            'closed' => $shouldClose,
            'updated_at' => now(),
        ]);

        $closeGlWarning = null;
        if ($shouldClose) {
            $totalCost = $this->postings->computeWorkOrderTotalCost($workOrderId);
            $unitCost = $unitsReqd > 0 ? round($totalCost / $unitsReqd, 4) : 0;
            $this->updateMaterialCost((string) ($wo->stock_id ?? ''), abs($signedQty), $unitCost, $date);

            if (! $this->isServiceItem((string) ($wo->stock_id ?? ''))) {
                $finishedMoveQty = $unitsBefore + $signedQty;
                $move = $this->stockMoves->insert(
                    (string) ($wo->stock_id ?? ''),
                    (string) ($wo->loc_code ?? ''),
                    $finishedMoveQty,
                    self::TYPE_WORKORDER,
                    (string) ($wo->wo_ref ?? $reference),
                    $date,
                    $workOrderId,
                    $unitCost
                );
                $this->locStockQty->applyStockMoveRecord($move);
            }

            $closeRun = GlPostingRunner::run(
                fn () => $this->postings->postWoClose($workOrderId, (string) ($wo->wo_ref ?? $reference), $date, $memo, $isUnassemble)
            );
            $closeGlWarning = $closeRun['gl_warning'];
        }

        $this->addComment(self::TYPE_WO_PRODUCTION, $manufactureId, $date, $memo);
        $this->addAuditTrail(self::TYPE_WO_PRODUCTION, $manufactureId, $date, 'Production');

        return GlPostingRunner::mergeWarning([
            'manufacture_id' => $manufactureId,
            'reference' => $reference,
            'workorder_id' => $workOrderId,
            'quantity' => $quantity,
            'closed' => $shouldClose,
        ], $closeGlWarning ?? $glWarning);
    }

    private function releaseWorkOrderInternal(int $workOrderId, string $releaseDate, string $memo): void
    {
        $wo = $this->requireWorkOrder($workOrderId);

        DB::table('workorders')->where('id', $workOrderId)->update([
            'released_date' => $releaseDate,
            'released' => true,
            'updated_at' => now(),
        ]);

        $this->createRequirementsFromBom($workOrderId, (string) ($wo->stock_id ?? ''), (string) ($wo->loc_code ?? ''));
        $this->addAuditTrail(self::TYPE_WORKORDER, $workOrderId, $releaseDate, 'Released');
    }

    private function createRequirementsFromBom(int $workOrderId, string $stockId, string $defaultLocCode = ''): void
    {
        if ($stockId === '' || ! Schema::hasTable('bom')) {
            return;
        }

        DB::table('wo_requirements')->where('workorder_id', $workOrderId)->delete();

        $defaultWorkCentre = (int) (DB::table('work_centres')->orderBy('id')->value('id') ?? 0);

        foreach (DB::table('bom')->where('parent', $stockId)->get() as $bom) {
            $componentId = (string) ($bom->component ?? '');
            if ($componentId === '') {
                continue;
            }

            $workCentre = (int) ($bom->work_centre ?? 0);
            if ($workCentre <= 0) {
                $workCentre = $defaultWorkCentre;
            }
            if ($workCentre <= 0) {
                throw new InvalidArgumentException('BOM component '.$componentId.' has no work centre. Add a work centre to the BOM or create one in Manufacturing setup.');
            }

            $locCode = trim((string) ($bom->loc_code ?? ''));
            if ($locCode === '') {
                $locCode = trim($defaultLocCode);
            }
            if ($locCode === '') {
                throw new InvalidArgumentException('BOM component '.$componentId.' has no location. Set a location on the BOM or on the work order.');
            }

            DB::table('wo_requirements')->insert([
                'workorder_id' => $workOrderId,
                'stock_id' => $componentId,
                'work_centre' => $workCentre,
                'units_req' => (float) ($bom->quantity ?? 0),
                'unit_cost' => $this->stockMaterialCost($componentId, $defaultLocCode),
                'loc_code' => $locCode,
                'units_issued' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * @return array{components: array<int, array{stock_id:string, amount:float, memo:string}>, consumptions: array<int, array{stock_id:string, loc_code:string, quantity:float}>}
     */
    private function consumeComponents(object $wo, int $workOrderId, float $produceQty, int $manufactureId, string $date, bool $isUnassemble = false): array
    {
        $components = [];
        $consumptions = [];
        $parentStockId = (string) ($wo->stock_id ?? '');
        $reference = (string) (DB::table('wo_manufacture')->where('id', $manufactureId)->value('reference') ?? '');

        $requirements = DB::table('wo_requirements')->where('workorder_id', $workOrderId)->get();
        if ($requirements->isEmpty()) {
            $this->createRequirementsFromBom($workOrderId, $parentStockId, (string) ($wo->loc_code ?? ''));
            $requirements = DB::table('wo_requirements')->where('workorder_id', $workOrderId)->get();
        }

        foreach ($requirements as $req) {
            $stockId = (string) ($req->stock_id ?? '');
            $bomQty = (float) ($req->units_req ?? 0);
            $unitsReqd = max(0.0001, (float) ($wo->units_reqd ?? 0));
            if ($bomQty <= 0) {
                $bomQty = (float) ($req->units_req ?? 0) / $unitsReqd;
            }
            $consumeQty = round($bomQty * $produceQty, 4);
            if ($stockId === '' || $consumeQty < 0.0001) {
                continue;
            }

            $unitCost = (float) ($req->unit_cost ?? 0);
            if ($unitCost <= 0) {
                $unitCost = $this->stockMaterialCost($stockId, (string) ($req->loc_code ?? $wo->loc_code ?? ''));
            }

            $reqLoc = (string) ($req->loc_code ?? $wo->loc_code ?? '');
            if (! $this->isServiceItem($stockId)) {
                if (! $isUnassemble) {
                    $this->assertSufficientStock($stockId, $reqLoc, $consumeQty);
                }
                $this->assertComponentHasCost($stockId, $reqLoc, $unitCost);
            }

            $this->updateRequirementIssued((int) $req->id, $consumeQty, $unitCost);

            if (! $this->isServiceItem($stockId)) {
                $moveQty = $isUnassemble ? abs($consumeQty) : -abs($consumeQty);
                $move = $this->stockMoves->insert(
                    $stockId,
                    $reqLoc,
                    $moveQty,
                    self::TYPE_WO_PRODUCTION,
                    $reference,
                    $date,
                    $manufactureId,
                    $unitCost
                );
                $this->locStockQty->applyStockMoveRecord($move);

                if (! $isUnassemble) {
                    $consumptions[] = [
                        'stock_id' => $stockId,
                        'loc_code' => $reqLoc,
                        'quantity' => $consumeQty,
                    ];
                }
            }

            $amount = round($consumeQty * $unitCost, 2);
            if ($amount >= 0.001) {
                $components[] = [
                    'stock_id' => $stockId,
                    'amount' => $amount,
                    'memo' => $consumeQty.' x '.$stockId,
                ];
            }
        }

        return ['components' => $components, 'consumptions' => $consumptions];
    }

    private function updateRequirementIssued(int $requirementId, float $quantity, float $unitCost): void
    {
        $req = DB::table('wo_requirements')->where('id', $requirementId)->first();
        if (! $req) {
            return;
        }

        $issued = (float) ($req->units_issued ?? 0);
        $oldCost = (float) ($req->unit_cost ?? 0);
        $newIssued = $issued + $quantity;
        $avgCost = $newIssued > 0
            ? (($issued * $oldCost) + ($quantity * $unitCost)) / $newIssued
            : $unitCost;

        DB::table('wo_requirements')->where('id', $requirementId)->update([
            'units_issued' => $newIssued,
            'unit_cost' => round($avgCost, 4),
            'updated_at' => now(),
        ]);
    }

    private function reverseRequirementIssued(int $workOrderId, float $produceQty, string $parentStockId): void
    {
        foreach (DB::table('wo_requirements')->where('workorder_id', $workOrderId)->get() as $req) {
            $bomQty = (float) ($req->units_req ?? 0);
            $consumeQty = round($bomQty * $produceQty, 4);
            DB::table('wo_requirements')->where('id', $req->id)->update([
                'units_issued' => max(0, (float) ($req->units_issued ?? 0) - $consumeQty),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function postOptionalCosts(int $workOrderId, array $payload, string $date, string $reference): void
    {
        $labour = round((float) ($payload['labour_cost'] ?? 0), 2);
        if ($labour > 0 && ! empty($payload['labour_credit_account'])) {
            $this->postAdditionalCostInternal([
                'workorder_id' => $workOrderId,
                'date' => $date,
                'amount' => $labour,
                'cost_type' => self::COST_LABOUR,
                'credit_account' => (string) $payload['labour_credit_account'],
                'reference' => $reference.'-LAB',
            ]);
        }

        $overhead = round((float) ($payload['overhead_cost'] ?? 0), 2);
        if ($overhead > 0 && ! empty($payload['overhead_credit_account'])) {
            $this->postAdditionalCostInternal([
                'workorder_id' => $workOrderId,
                'date' => $date,
                'amount' => $overhead,
                'cost_type' => self::COST_OVERHEAD,
                'credit_account' => (string) $payload['overhead_credit_account'],
                'reference' => $reference.'-OH',
            ]);
        }
    }

    private function postIssueGl(int $issueNo): ?string
    {
        $run = GlPostingRunner::run(fn () => $this->postings->postWoIssue($issueNo));

        return $run['gl_warning'];
    }

    private function requireWorkOrder(int $workOrderId): object
    {
        if ($workOrderId <= 0) {
            throw new InvalidArgumentException('Work order id is required.');
        }

        $wo = DB::table('workorders')->where('id', $workOrderId)->first();
        if (! $wo) {
            throw new InvalidArgumentException("Work order {$workOrderId} not found.");
        }

        return $wo;
    }

    /**
     * @return array<string, mixed>
     */
    private function workOrderResponse(int $workOrderId): array
    {
        $wo = WorkOrder::query()->find($workOrderId);

        return $wo ? $wo->toArray() : ['id' => $workOrderId];
    }

    private function nextIssueNo(): int
    {
        $max = (int) DB::table('wo_issues')->max('issue_no');

        return max($max, 0) + 1;
    }

    private function nextJournalTransNo(): int
    {
        $max = (int) DB::table('journal')->where('type', self::TYPE_JOURNAL)->max('trans_no');

        return max($max, 0) + 1;
    }

    private function stockMaterialCost(string $stockId, ?string $locCode = null): float
    {
        return $this->postings->resolveStockUnitCost($stockId, $locCode);
    }

    private function isServiceItem(string $stockId): bool
    {
        if ($stockId === '' || ! Schema::hasTable('stock_master')) {
            return false;
        }

        return (int) DB::table('stock_master')->where('stock_id', $stockId)->value('mb_flag') === ItemMbFlag::SERVICE;
    }

    private function assertSufficientStock(string $stockId, string $locCode, float $qtyNeeded): void
    {
        if ($qtyNeeded < 0.0001) {
            return;
        }

        $onHand = $this->stockMoves->quantityOnHand($stockId, $locCode);
        if ($onHand + 0.0001 < $qtyNeeded) {
            throw new InvalidArgumentException(
                sprintf(
                    'Insufficient stock for %s at %s. Required: %.4f, on hand: %.4f. Receive via Purchase GRN or inventory adjustment first.',
                    $stockId,
                    strtoupper(trim($locCode)),
                    $qtyNeeded,
                    $onHand
                )
            );
        }
    }

    private function assertComponentHasCost(string $stockId, string $locCode, float $unitCost): void
    {
        if ($unitCost >= 0.0001) {
            return;
        }

        throw new InvalidArgumentException(
            sprintf(
                'Component %s has no material cost. Receive it via Purchase GRN or set purchase/material cost on the item before manufacturing.',
                $stockId
            )
        );
    }

    private function updateMaterialCost(string $stockId, float $qty, float $unitCost, string $date): void
    {
        if ($stockId === '' || $qty <= 0 || ! Schema::hasTable('stock_master')) {
            return;
        }

        $onHand = (float) DB::table('stock_moves')->where('stock_id', $stockId)->sum('qty');
        $oldQty = max(0, $onHand - $qty);
        $oldCost = $this->stockMaterialCost($stockId);
        $newCost = ($oldQty + $qty) > 0
            ? round((($oldQty * $oldCost) + ($qty * $unitCost)) / ($oldQty + $qty), 4)
            : $unitCost;

        DB::table('stock_master')->where('stock_id', $stockId)->update([
            'material_cost' => $newCost,
            'updated_at' => now(),
        ]);
    }

    private function addComment(int $type, int $transNo, string $date, string $memo): void
    {
        if ($memo === '' || ! Schema::hasTable('comments')) {
            return;
        }

        DB::table('comments')->insert([
            'type' => $type,
            'id' => $transNo,
            'date_' => $date,
            'memo_' => $memo,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function addAuditTrail(int $type, int $transNo, string $glDate, string $description): void
    {
        if (! Schema::hasTable('audit_trail')) {
            return;
        }

        $range = ActiveFiscalYear::range($glDate);
        $fiscalYearId = (int) ($range['id'] ?? 0);
        if ($fiscalYearId <= 0) {
            return;
        }

        DB::table('audit_trail')->insert([
            'type' => $type,
            'trans_no' => $transNo,
            'user' => (int) (Auth::id() ?? 0),
            'description' => substr($description, 0, 60),
            'fiscal_year' => $fiscalYearId,
            'gl_date' => $glDate,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
