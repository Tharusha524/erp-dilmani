<?php

namespace App\Services\Purchasing;

use App\Models\PurchOrder;
use App\Models\PurchOrderDetail;
use Illuminate\Support\Facades\DB;

/**
 * FrontAccounting add_po() — header + lines in one DB transaction.
 */
class PurchOrderPostingService
{
    /**
     * @param  array<string, mixed>  $header
     * @param  list<array<string, mixed>>  $lines
     * @return array{order: PurchOrder, lines: list<PurchOrderDetail>}
     */
    public function createWithDetails(array $header, array $lines): array
    {
        if ($lines === []) {
            throw new \InvalidArgumentException('At least one purchase order line is required.');
        }

        return DB::transaction(function () use ($header, $lines) {
            $order = $this->createHeader($this->normalizeHeader($header));
            $createdLines = [];
            foreach ($lines as $line) {
                $line['order_no'] = $order->order_no;
                $createdLines[] = PurchOrderDetail::query()->create($this->normalizeLine($line));
            }

            return ['order' => $order->fresh(), 'lines' => $createdLines];
        });
    }

    /**
     * @param  array<string, mixed>  $header
     * @param  list<array<string, mixed>>  $lines
     * @param  list<int|string>  $deleteDetailIds
     * @return array{order: PurchOrder, lines: list<PurchOrderDetail>}
     */
    public function updateWithDetails(
        int $orderNo,
        array $header,
        array $lines,
        array $deleteDetailIds = []
    ): array {
        if ($lines === []) {
            throw new \InvalidArgumentException('At least one purchase order line is required.');
        }

        return DB::transaction(function () use ($orderNo, $header, $lines, $deleteDetailIds) {
            $order = PurchOrder::query()->where('order_no', $orderNo)->firstOrFail();
            $order->update($this->normalizeHeader($header));

            if ($deleteDetailIds !== []) {
                PurchOrderDetail::query()
                    ->where('order_no', $orderNo)
                    ->whereIn('po_detail_item', $deleteDetailIds)
                    ->delete();
            }

            $createdLines = [];
            foreach ($lines as $line) {
                $line['order_no'] = $orderNo;
                $detailId = $line['po_detail_item'] ?? $line['id'] ?? null;
                unset($line['id']);

                if ($detailId) {
                    $detail = PurchOrderDetail::query()
                        ->where('order_no', $orderNo)
                        ->where('po_detail_item', $detailId)
                        ->first();
                    if ($detail) {
                        $detail->update($this->normalizeLine($line));
                        $createdLines[] = $detail->fresh();
                        continue;
                    }
                }

                $createdLines[] = PurchOrderDetail::query()->create($this->normalizeLine($line));
            }

            return ['order' => $order->fresh(), 'lines' => $createdLines];
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function createHeader(array $data): PurchOrder
    {
        $attempts = 0;
        while ($attempts < 3) {
            try {
                return PurchOrder::query()->create($data);
            } catch (\Illuminate\Database\QueryException $e) {
                $attempts++;
                if ($e->getCode() == '23000') {
                    $max = (int) (DB::table('purch_orders')->max('order_no') ?? 0);
                    $data['order_no'] = $max + 1;
                    continue;
                }
                throw $e;
            }
        }

        throw new \RuntimeException('Unable to allocate unique order_no after retries');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeHeader(array $data): array
    {
        if (isset($data['order_no'])) {
            $data['order_no'] = (int) $data['order_no'];
        }
        $data['delivery_address'] = trim((string) ($data['delivery_address'] ?? ''));
        $data['comments'] = $data['comments'] ?? null;
        $data['requisition_no'] = $data['requisition_no'] ?? null;
        $data['total'] = round((float) ($data['total'] ?? 0), 2);
        $data['prep_amount'] = round((float) ($data['prep_amount'] ?? 0), 2);
        $data['alloc'] = round((float) ($data['alloc'] ?? 0), 2);
        $data['tax_included'] = (bool) ($data['tax_included'] ?? false);

        return $data;
    }

    /**
     * @param  array<string, mixed>  $line
     * @return array<string, mixed>
     */
    private function normalizeLine(array $line): array
    {
        return [
            'order_no' => (int) ($line['order_no'] ?? 0),
            'item_code' => (string) ($line['item_code'] ?? ''),
            'description' => $line['description'] ?? null,
            'delivery_date' => $line['delivery_date'] ?? now()->toDateString(),
            'qty_invoiced' => round((float) ($line['qty_invoiced'] ?? 0), 4),
            'unit_price' => round((float) ($line['unit_price'] ?? 0), 4),
            'discount_percent' => round((float) ($line['discount_percent'] ?? 0), 4),
            'act_price' => round((float) ($line['act_price'] ?? $line['unit_price'] ?? 0), 4),
            'std_cost_unit' => round((float) ($line['std_cost_unit'] ?? 0), 4),
            'quantity_ordered' => round((float) ($line['quantity_ordered'] ?? $line['quantity'] ?? 0), 4),
            'quantity_received' => round((float) ($line['quantity_received'] ?? 0), 4),
        ];
    }
}
