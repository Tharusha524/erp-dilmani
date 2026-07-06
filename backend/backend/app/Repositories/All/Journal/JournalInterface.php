<?php

namespace App\Repositories\All\Journal;

use App\Repositories\Base\EloquentRepositoryInterface;
use Illuminate\Support\Collection;

interface JournalInterface extends EloquentRepositoryInterface
{
    public function search(array $filters): Collection;

    public function deleteTransaction(int $transType, int $transNo, ?string $voidDate = null, ?string $memo = null): bool;
}
