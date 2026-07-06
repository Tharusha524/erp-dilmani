<?php

namespace App\Repositories\All\SysPrefs;

use App\Repositories\Base\EloquentRepositoryInterface;

interface SysPrefsInterface extends EloquentRepositoryInterface
{
    public function ensureSeeded(): void;

    /** @param array<string, string> $values */
    public function bulkUpsert(array $values): int;
}
