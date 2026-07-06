<?php

namespace App\Repositories\All\CostCenter;

use App\Models\CostCenter;
use App\Repositories\Base\BaseRepository;
use App\Support\CostCenterGlBalance;
use Illuminate\Support\Collection;

class CostCenterRepository extends BaseRepository implements CostCenterInterface
{
    public function __construct(CostCenter $model)
    {
        parent::__construct($model);
    }

    public function search(array $filters): Collection
    {
        $query = $this->model->newQuery()->with('tag');

        if (!empty($filters['reference'])) {
            $query->where('reference', 'like', '%' . $filters['reference'] . '%');
        }

        if (!empty($filters['fromId'])) {
            $query->where('id', '>=', (int) $filters['fromId']);
        }

        if (!empty($filters['toId'])) {
            $query->where('id', '<=', (int) $filters['toId']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', (int) $filters['type']);
        }

        if (!empty($filters['fromDate'])) {
            $query->whereDate('start_date', '>=', $filters['fromDate']);
        }

        if (!empty($filters['toDate'])) {
            $query->whereDate('start_date', '<=', $filters['toDate']);
        }

        if (!empty($filters['onlyOpen'])) {
            $query->where('closed', false);
        }

        if (!empty($filters['onlyOverdue'])) {
            $query->where('closed', false)
                ->whereNotNull('date_required_by')
                ->whereDate('date_required_by', '<', now()->toDateString());
        }

        if (!empty($filters['outstandingOnly'])) {
            $query->where('closed', false);
        }

        $rows = $query->orderBy('reference')->orderByDesc('id')->get();

        $balanceFrom = $filters['balanceFromDate'] ?? $filters['fromDate'] ?? null;
        $balanceTo = $filters['balanceToDate'] ?? $filters['toDate'] ?? null;

        return $rows->map(function (CostCenter $dim) use ($balanceFrom, $balanceTo) {
            $dim->setAttribute(
                'balance',
                CostCenterGlBalance::sum((int) $dim->id, $balanceFrom, $balanceTo)
            );

            return $dim;
        });
    }

    public function glBalance(int $costCenterId, ?string $fromDate = null, ?string $toDate = null): array
    {
        $lines = CostCenterGlBalance::byAccount($costCenterId, $fromDate, $toDate);
        $total = round($lines->sum(fn ($line) => (float) $line->amount), 2);

        return [
            'total' => $total,
            'lines' => $lines,
        ];
    }

    public function hasGlTransactions(int $costCenterId): bool
    {
        return CostCenterGlBalance::hasTransactions($costCenterId);
    }
}
