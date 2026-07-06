<?php

namespace App\Repositories\All\SysPrefs;

use App\Models\SysPrefs;
use App\Repositories\Base\BaseRepository;
use App\Support\GlAccountResolver;
use App\Support\SysPrefsDefinitions;
use Illuminate\Support\Facades\DB;

class SysPrefsRepository extends BaseRepository implements SysPrefsInterface
{
    public function __construct(SysPrefs $model)
    {
        parent::__construct($model);
    }

    public function ensureSeeded(): void
    {
        if ($this->model->newQuery()->count() > 0) {
            GlAccountResolver::syncAllPrefs();

            return;
        }

        $now = now();
        foreach (SysPrefsDefinitions::all() as $pref) {
            DB::table('sys_prefs')->insert([
                'name' => $pref['name'],
                'category' => $pref['category'],
                'type' => $pref['type'],
                'length' => $pref['length'],
                'value' => $pref['value'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function bulkUpsert(array $values): int
    {
        $this->ensureSeeded();
        $definitions = SysPrefsDefinitions::byName();
        $updated = 0;

        foreach ($values as $name => $value) {
            if (!isset($definitions[$name])) {
                continue;
            }
            $meta = $definitions[$name];
            SysPrefs::query()->updateOrCreate(
                ['name' => $name],
                [
                    'category' => $meta['category'],
                    'type' => $meta['type'],
                    'length' => $meta['length'],
                    'value' => (string) $value,
                ]
            );
            $updated++;
        }

        GlAccountResolver::syncAllPrefs();

        return $updated;
    }
}
