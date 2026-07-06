<?php

use App\Support\GlAccountResolver;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('chart_master')) {
            return;
        }

        $resolvedCogs = GlAccountResolver::resolve(
            'cogsAccount',
            DB::table('sys_prefs')->where('name', 'cogsAccount')->value('value')
        );

        if ($resolvedCogs) {
            if (Schema::hasTable('sys_prefs')) {
                DB::table('sys_prefs')->where('name', 'cogsAccount')->update([
                    'value' => $resolvedCogs,
                    'updated_at' => now(),
                ]);
            }

            $badCogsCodes = ['2315'];
            $currentCogsPref = DB::table('sys_prefs')->where('name', 'cogsAccount')->value('value');
            if ($currentCogsPref && ! GlAccountResolver::isCogsAccountName(
                (string) DB::table('chart_master')->where('account_code', $currentCogsPref)->value('account_name')
            )) {
                $badCogsCodes[] = (string) $currentCogsPref;
            }
            $badCogsCodes = array_values(array_unique($badCogsCodes));

            if (Schema::hasTable('stock_master')) {
                DB::table('stock_master')
                    ->whereIn('cogs_account', $badCogsCodes)
                    ->update(['cogs_account' => $resolvedCogs, 'updated_at' => now()]);
            }

            if (Schema::hasTable('item_category')) {
                DB::table('item_category')
                    ->whereIn('dflt_cogs_act', $badCogsCodes)
                    ->update(['dflt_cogs_act' => $resolvedCogs, 'updated_at' => now()]);
            }
        }

        if (Schema::hasTable('sys_prefs')) {
            $currentDeferred = DB::table('sys_prefs')->where('name', 'deferredIncomeAccount')->value('value');
            $resolvedDeferred = GlAccountResolver::resolve(
                'deferredIncomeAccount',
                $currentDeferred ? (string) $currentDeferred : null
            );
            if ($resolvedDeferred && $resolvedDeferred !== $currentDeferred) {
                DB::table('sys_prefs')->where('name', 'deferredIncomeAccount')->update([
                    'value' => $resolvedDeferred,
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Non-destructive: keep corrected GL account mapping.
    }
};
