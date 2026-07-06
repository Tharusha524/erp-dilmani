<?php

namespace App\Services\Inventory;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Low-level stock_moves inserts (inventory items, not fixed-asset-only).
 */
class StockMoveWriter
{
    private const TABLE = 'stock_moves';

    public function quantityOnHand(string $stockId, string $locCode): float
    {
        if (! Schema::hasTable(self::TABLE)) {
            return 0;
        }

        $stockColumn = $this->column('stock_id', ['item_code']);
        $locColumn = $this->column('loc_code', ['location']);
        $qtyColumn = $this->column('qty', ['quantity']);

        return (float) DB::table(self::TABLE)
            ->where($stockColumn, $stockId)
            ->where($locColumn, strtoupper(trim($locCode)))
            ->sum($qtyColumn);
    }

    public function nextTransNo(int $type): int
    {
        $typeColumn = $this->column('type', ['trans_type']);
        $numberColumn = $this->column('trans_no', ['type_no']);

        $max = (int) DB::table(self::TABLE)->where($typeColumn, $type)->max($numberColumn);

        return max($max, 0) + 1;
    }

    /**
     * @return array{trans_id:int,trans_no:int,stock_id:string,loc_code:string,qty:float,standard_cost:float}
     */
    public function insert(
        string $stockId,
        string $locCode,
        float $qty,
        int $type,
        string $reference,
        string $tranDate,
        int $transNo,
        float $standardCost = 0
    ): array {
        if (! Schema::hasTable(self::TABLE)) {
            throw new \InvalidArgumentException('Stock moves table is not available.');
        }

        $row = [];
        $row[$this->column('stock_id', ['item_code'])] = $stockId;
        $row[$this->column('type', ['trans_type'])] = $type;
        $row[$this->column('loc_code', ['location'])] = strtoupper(trim($locCode));
        $row[$this->column('qty', ['quantity'])] = round($qty, 4);
        $row[$this->column('trans_no', ['type_no'])] = $transNo;
        $row[$this->column('tran_date', ['date', 'trans_date'])] = $tranDate;
        $row[$this->column('reference', ['ref'])] = mb_substr($reference, 0, 40);

        if (Schema::hasColumn(self::TABLE, 'price')) {
            $row['price'] = 0;
        }
        if (Schema::hasColumn(self::TABLE, 'standard_cost')) {
            $row['standard_cost'] = round($standardCost, 2);
        }

        $pkColumn = $this->column('trans_id', ['id']);
        $transId = (int) DB::table(self::TABLE)->insertGetId($row, $pkColumn);

        return [
            'trans_id' => $transId,
            'trans_no' => $transNo,
            'stock_id' => $stockId,
            'loc_code' => strtoupper(trim($locCode)),
            'qty' => round($qty, 4),
            'standard_cost' => round($standardCost, 2),
        ];
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
