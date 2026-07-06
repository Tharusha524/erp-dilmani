<?php

namespace App\Services\FixedAssets;

use App\Models\StockMaster;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FaStockMoveService
{
    public const TYPE_LOCATION_TRANSFER = 16;

    public const TYPE_INVENTORY_ADJUSTMENT = 17;

    public const TYPE_SALES_DELIVERY = 13;

    private const TABLE = 'stock_moves';

    public function __construct(private FaLocationSyncService $locationSync)
    {
    }

    public function quantityOnHand(string $stockId, string $locCode): float
    {
        if (! Schema::hasTable(self::TABLE)) {
            return 0;
        }

        $qtyColumn = $this->column('qty', ['quantity']);
        $stockColumn = $this->column('stock_id', ['item_code']);
        $locColumn = $this->column('loc_code', ['location']);

        $loc = strtoupper(trim($locCode));

        return (float) DB::table(self::TABLE)
            ->where($stockColumn, $stockId)
            ->where($locColumn, $loc)
            ->sum($qtyColumn);
    }

    /**
     * @return array{trans_id:int,trans_no:int,stock_id:string,loc_code:string,qty:float}
     */
    public function insertMove(
        string $stockId,
        string $locCode,
        float $qty,
        int $type,
        string $reference,
        string $tranDate,
        ?int $transNo = null,
        float $standardCost = 0
    ): array {
        if (! Schema::hasTable(self::TABLE)) {
            throw new \InvalidArgumentException('Stock moves table is not available.');
        }

        $asset = StockMaster::query()->where('stock_id', $stockId)->first();
        if (! $asset || (int) $asset->mb_flag !== FaDepreciationService::FA_MB_FLAG) {
            throw new \InvalidArgumentException("Item {$stockId} is not a fixed asset.");
        }

        $resolvedLoc = $this->locationSync->ensureInventoryLocation($locCode);
        $typeNo = $transNo ?? $this->nextTransNo($type);

        $row = $this->buildInsertRow(
            $stockId,
            $resolvedLoc,
            $qty,
            $type,
            $reference,
            $tranDate,
            $typeNo,
            $standardCost
        );

        $pkColumn = $this->column('trans_id', ['id']);
        $transId = (int) DB::table(self::TABLE)->insertGetId($row, $pkColumn);

        return [
            'trans_id' => $transId,
            'trans_no' => (int) $typeNo,
            'stock_id' => $stockId,
            'loc_code' => $resolvedLoc,
            'qty' => round($qty, 4),
        ];
    }

    public function nextTransNo(int $type): int
    {
        $typeColumn = $this->column('type', ['trans_type']);
        $numberColumn = $this->column('trans_no', ['type_no']);

        $max = (int) DB::table(self::TABLE)->where($typeColumn, $type)->max($numberColumn);

        return max($max, 0) + 1;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildInsertRow(
        string $stockId,
        string $locCode,
        float $qty,
        int $type,
        string $reference,
        string $tranDate,
        int $transNo,
        float $standardCost
    ): array {
        $row = [];

        $row[$this->column('stock_id', ['item_code'])] = $stockId;
        $row[$this->column('type', ['trans_type'])] = $type;
        $row[$this->column('loc_code', ['location'])] = $locCode;
        $row[$this->column('qty', ['quantity'])] = round($qty, 4);
        $row[$this->column('trans_no', ['type_no'])] = $transNo;

        $dateColumn = $this->column('tran_date', ['date', 'trans_date']);
        $row[$dateColumn] = $tranDate;

        $refColumn = $this->column('reference', ['ref']);
        $row[$refColumn] = mb_substr($reference, 0, 40);

        if (Schema::hasColumn(self::TABLE, 'price')) {
            $row['price'] = 0;
        }

        if (Schema::hasColumn(self::TABLE, 'standard_cost')) {
            $row['standard_cost'] = round($standardCost, 2);
        }

        return $row;
    }

    /**
     * @param  list<string>  $alternatives
     */
    private function column(string $preferred, array $alternatives = []): string
    {
        if (Schema::hasColumn(self::TABLE, $preferred)) {
            return $preferred;
        }

        foreach ($alternatives as $column) {
            if (Schema::hasColumn(self::TABLE, $column)) {
                return $column;
            }
        }

        throw new \InvalidArgumentException(
            'The stock_moves table is missing required column "'.$preferred.'".'
        );
    }
}
