<?php

namespace App\Services\System;

use App\Models\CompanySetup;
use App\Models\FiscalYear;
use App\Models\StockMaster;
use App\Support\InventoryPreferences;
use Carbon\Carbon;
use Illuminate\Database\Migrations\Migrator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SystemDiagnosticsService
{
    private int $id = 0;

    /** @var array<int, array<string, mixed>> */
    private array $lines = [];

    public function run(): array
    {
        $this->lines = [];
        $this->id = 0;

        $this->checkDatabase();
        $this->checkStorage();
        $this->checkPendingMigrations();
        $this->checkCompanySetup();
        $this->checkCriticalGlAccounts();
        $this->checkFiscalYear();
        $this->checkChartOfAccounts();
        $this->checkGlBalance();
        $this->checkInventoryItemsAccounts();
        $this->checkFixedAssetsSetup();
        $this->checkNegativeStock();
        $this->checkOrphanGlAccounts();

        $summary = ['ok' => 0, 'warning' => 0, 'error' => 0, 'total' => count($this->lines)];
        foreach ($this->lines as $line) {
            $summary[$line['status']]++;
        }

        return [
            'ran_at' => now()->toIso8601String(),
            'summary' => $summary,
            'lines' => $this->lines,
        ];
    }

    private function add(
        string $test,
        string $testType,
        string $value,
        string $status,
        string $comments
    ): void {
        $this->id++;
        $this->lines[] = [
            'id' => $this->id,
            'test' => $test,
            'test_type' => $testType,
            'value' => $value,
            'status' => $status,
            'comments' => $comments,
        ];
    }

    private function checkDatabase(): void
    {
        try {
            DB::connection()->getPdo();
            $tables = ['company_setup', 'chart_master', 'sys_prefs', 'stock_master', 'gl_trans'];
            $missing = array_filter($tables, fn ($t) => !Schema::hasTable($t));
            if ($missing) {
                $this->add(
                    'Database schema',
                    'System',
                    'Incomplete',
                    'error',
                    'Missing tables: ' . implode(', ', $missing)
                );
                return;
            }
            $this->add('Database connection', 'System', 'OK', 'ok', 'Connected and core tables exist.');
        } catch (\Throwable $e) {
            $this->add('Database connection', 'System', 'Failed', 'error', $e->getMessage());
        }
    }

    private function checkStorage(): void
    {
        $writable = is_writable(storage_path('logs')) && is_writable(storage_path('framework'));
        $this->add(
            'Storage directories',
            'System',
            $writable ? 'Writable' : 'Not writable',
            $writable ? 'ok' : 'error',
            $writable
                ? 'Application storage paths are writable.'
                : 'Check permissions on storage/logs and storage/framework.'
        );
    }

    private function checkPendingMigrations(): void
    {
        try {
            /** @var Migrator $migrator */
            $migrator = app('migrator');
            $files = $migrator->getMigrationFiles(database_path('migrations'));
            $ran = $migrator->getRepository()->getRan();
            $pending = count(array_diff(array_keys($files), $ran));
            if ($pending === 0) {
                $this->add('Database migrations', 'System', 'Up to date', 'ok', 'All migrations have been applied.');
            } else {
                $this->add(
                    'Database migrations',
                    'System',
                    (string) $pending . ' pending',
                    'warning',
                    'Run php artisan migrate to apply pending migrations.'
                );
            }
        } catch (\Throwable $e) {
            $this->add('Database migrations', 'System', 'Unknown', 'warning', $e->getMessage());
        }
    }

    private function checkCompanySetup(): void
    {
        if (!Schema::hasTable('company_setup')) {
            return;
        }
        $company = CompanySetup::query()->first();
        if (!$company) {
            $this->add('Company profile', 'Setup', 'Missing', 'error', 'No company record found. Complete Company Setup.');
            return;
        }
        if (trim((string) $company->name) === '') {
            $this->add('Company profile', 'Setup', 'Incomplete', 'warning', 'Company name is not set.');
            return;
        }
        $currency = $company->home_currency_id ? 'set' : 'missing';
        $this->add(
            'Company profile',
            'Setup',
            'OK',
            $company->home_currency_id ? 'ok' : 'warning',
            'Company: ' . $company->name . '. Home currency: ' . $currency . '.'
        );
    }

    private function checkCriticalGlAccounts(): void
    {
        $critical = [
            'receivableAccount' => 'Sales / AR',
            'payableAccount' => 'Purchasing / AP',
            'salesAccount' => 'Sales revenue',
            'inventoryAccount' => 'Inventory',
            'cogsAccount' => 'COGS',
            'retainedEarnings' => 'Retained earnings',
            'grnClearingAccount' => 'GRN clearing',
            'lossOnAssetDisposalAccount' => 'FA disposal loss',
        ];

        $missing = [];
        $invalid = [];

        foreach ($critical as $prefName => $label) {
            $code = DB::table('sys_prefs')->where('name', $prefName)->value('value');
            if (!$code || trim((string) $code) === '') {
                $missing[] = $label;
                continue;
            }
            $account = DB::table('chart_master')->where('account_code', $code)->first();
            if (!$account) {
                $invalid[] = $label . ' (' . $code . ')';
            } elseif ((int) ($account->inactive ?? 0) === 1) {
                $invalid[] = $label . ' (' . $code . ' inactive)';
            }
        }

        if ($missing === [] && $invalid === []) {
            $this->add('GL default accounts', 'GL Setup', 'OK', 'ok', 'Critical system GL accounts are configured.');
            return;
        }

        $comments = [];
        if ($missing) {
            $comments[] = 'Not configured: ' . implode(', ', $missing);
        }
        if ($invalid) {
            $comments[] = 'Invalid or inactive: ' . implode(', ', $invalid);
        }

        $this->add(
            'GL default accounts',
            'GL Setup',
            count($missing) + count($invalid) . ' issue(s)',
            count($invalid) > 0 ? 'error' : 'warning',
            implode(' ', $comments)
        );
    }

    private function checkFiscalYear(): void
    {
        if (!Schema::hasTable('fiscal_years')) {
            return;
        }

        $today = Carbon::today();
        $open = FiscalYear::query()
            ->where('closed', 0)
            ->whereDate('fiscal_year_from', '<=', $today)
            ->whereDate('fiscal_year_to', '>=', $today)
            ->first();

        if ($open) {
            $this->add(
                'Open fiscal year',
                'GL Setup',
                'OK',
                'ok',
                'Active year: ' . $open->fiscal_year_from . ' to ' . $open->fiscal_year_to . '.'
            );
            return;
        }

        $anyOpen = FiscalYear::query()->where('closed', 0)->count();
        $this->add(
            'Open fiscal year',
            'GL Setup',
            $anyOpen > 0 ? 'Out of range' : 'None open',
            'warning',
            $anyOpen > 0
                ? 'A fiscal year exists but today is outside its date range.'
                : 'Create or open a fiscal year that includes today.'
        );
    }

    private function checkChartOfAccounts(): void
    {
        $count = (int) DB::table('chart_master')->count();
        $active = (int) DB::table('chart_master')->where('inactive', 0)->count();
        if ($count === 0) {
            $this->add('Chart of accounts', 'GL Setup', 'Empty', 'error', 'No GL accounts defined.');
            return;
        }
        $this->add(
            'Chart of accounts',
            'GL Setup',
            (string) $active . ' active',
            'ok',
            $count . ' account(s) total, ' . $active . ' active.'
        );
    }

    private function checkGlBalance(): void
    {
        if (!Schema::hasTable('gl_trans')) {
            return;
        }

        try {
            if (Schema::hasColumn('gl_trans', 'debit') && Schema::hasColumn('gl_trans', 'credit')) {
                $totals = DB::table('gl_trans')
                    ->selectRaw('COALESCE(SUM(debit),0) as debits, COALESCE(SUM(credit),0) as credits')
                    ->first();
                $debits = round((float) ($totals->debits ?? 0), 2);
                $credits = round((float) ($totals->credits ?? 0), 2);
                $diff = round(abs($debits - $credits), 2);
            } elseif (Schema::hasColumn('gl_trans', 'amount')) {
                $net = round((float) DB::table('gl_trans')->sum('amount'), 2);
                $debits = round((float) DB::table('gl_trans')->where('amount', '>', 0)->sum('amount'), 2);
                $credits = round(abs((float) DB::table('gl_trans')->where('amount', '<', 0)->sum('amount')), 2);
                $diff = abs($net);
            } else {
                $this->add(
                    'GL transaction balance',
                    'GL',
                    'Skipped',
                    'warning',
                    'GL table schema not recognized; cannot verify balance.'
                );
                return;
            }

            if ($diff < 0.01) {
                $this->add(
                    'GL transaction balance',
                    'GL',
                    'Balanced',
                    'ok',
                    'Total debits and credits match (' . number_format($debits, 2) . ').'
                );
                return;
            }

            $this->add(
                'GL transaction balance',
                'GL',
                'Out of balance',
                'error',
                'Difference of ' . number_format($diff, 2) . ' (Debits: ' . number_format($debits, 2) . ', Credits: ' . number_format($credits, 2) . ').'
            );
        } catch (\Throwable $e) {
            $this->add('GL transaction balance', 'GL', 'Check failed', 'warning', $e->getMessage());
        }
    }

    private function checkInventoryItemsAccounts(): void
    {
        if (!Schema::hasTable('stock_master')) {
            return;
        }

        $count = StockMaster::query()
            ->where('inactive', 0)
            ->whereIn('mb_flag', [0, 1, 2])
            ->where(function ($q) {
                $q->whereNull('sales_account')->orWhere('sales_account', '')
                    ->orWhereNull('cogs_account')->orWhere('cogs_account', '')
                    ->orWhereNull('inventory_account')->orWhere('inventory_account', '');
            })
            ->count();

        if ($count === 0) {
            $this->add('Inventory item GL accounts', 'Inventory', 'OK', 'ok', 'Active inventory items have GL accounts.');
            return;
        }

        $this->add(
            'Inventory item GL accounts',
            'Inventory',
            (string) $count . ' item(s)',
            'warning',
            $count . ' active inventory item(s) missing sales, COGS, or inventory account.'
        );
    }

    private function checkFixedAssetsSetup(): void
    {
        if (!Schema::hasTable('stock_master')) {
            return;
        }

        $count = StockMaster::query()
            ->where('mb_flag', 4)
            ->where('inactive', 0)
            ->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->whereNull('cogs_account')->orWhere('cogs_account', '')
                        ->orWhereNull('adjustment_account')->orWhere('adjustment_account', '');
                })
                    ->orWhereNull('depreciation_method')->orWhere('depreciation_method', '')
                    ->orWhere('depreciation_rate', '<=', 0)
                    ->orWhereRaw('(COALESCE(purchase_cost,0) + COALESCE(material_cost,0)) <= 0');
            })
            ->count();

        if ($count === 0) {
            $this->add('Fixed assets configuration', 'Fixed Assets', 'OK', 'ok', 'Active fixed assets have accounts, method, rate, and cost.');
            return;
        }

        $this->add(
            'Fixed assets configuration',
            'Fixed Assets',
            (string) $count . ' asset(s)',
            'warning',
            $count . ' fixed asset(s) missing expense/accumulated accounts, depreciation settings, or cost.'
        );
    }

    private function checkNegativeStock(): void
    {
        if (!Schema::hasTable('loc_stock') || !Schema::hasTable('sys_prefs')) {
            return;
        }

        if (InventoryPreferences::allowNegativeInventory()) {
            $this->add(
                'Negative stock levels',
                'Inventory',
                'Allowed',
                'ok',
                'Negative inventory is permitted in system settings.'
            );
            return;
        }

        if (!Schema::hasColumn('loc_stock', 'quantity')) {
            $this->add(
                'Negative stock levels',
                'Inventory',
                'Skipped',
                'ok',
                'Stock quantity column not present; check inventory via stock moves if needed.'
            );
            return;
        }

        $negativeRows = DB::table('loc_stock as ls')
            ->where('ls.quantity', '<', 0)
            ->when(
                Schema::hasTable('stock_master'),
                fn ($q) => $q->leftJoin('stock_master as sm', 'sm.stock_id', '=', 'ls.stock_id')
                    ->select(['ls.loc_code', 'ls.stock_id', 'ls.quantity', 'sm.description'])
            )
            ->when(
                ! Schema::hasTable('stock_master'),
                fn ($q) => $q->select(['ls.loc_code', 'ls.stock_id', 'ls.quantity'])
            )
            ->orderBy('ls.loc_code')
            ->orderBy('ls.stock_id')
            ->limit(20)
            ->get();

        $count = (int) DB::table('loc_stock')->where('quantity', '<', 0)->count();
        if ($count === 0) {
            $this->add('Negative stock levels', 'Inventory', 'None', 'ok', 'No negative quantities in stock locations.');
            return;
        }

        $details = $negativeRows->map(function ($row) {
            $label = trim((string) ($row->description ?? ''));
            $item = $label !== '' ? "{$row->stock_id} ({$label})" : (string) $row->stock_id;

            return "{$item} @ {$row->loc_code}: ".number_format((float) $row->quantity, 4, '.', '');
        })->implode('; ');

        $suffix = $count > $negativeRows->count()
            ? ' (showing first '.$negativeRows->count().')'
            : '';

        $this->add(
            'Negative stock levels',
            'Inventory',
            (string) $count . ' line(s)',
            'error',
            $count.' location stock line(s) have negative quantity and negative stock is not allowed. '
            .$details.$suffix
            .' Fix via Inventory Adjustment, void incorrect deliveries, or enable Allow Negative Inventory in System & GL Setup.'
        );
    }

    private function checkOrphanGlAccounts(): void
    {
        if (!Schema::hasTable('gl_trans') || !Schema::hasTable('chart_master')) {
            return;
        }

        if (!Schema::hasColumn('gl_trans', 'account')) {
            $this->add(
                'GL account references',
                'GL',
                'Skipped',
                'ok',
                'GL postings use a schema without per-line account codes.'
            );
            return;
        }

        try {
            $orphans = DB::table('gl_trans as g')
                ->leftJoin('chart_master as c', 'g.account', '=', 'c.account_code')
                ->whereNotNull('g.account')
                ->where('g.account', '!=', '')
                ->whereNull('c.account_code')
                ->distinct()
                ->count('g.account');

            if ($orphans === 0) {
                $this->add('GL account references', 'GL', 'OK', 'ok', 'All GL postings reference valid chart accounts.');
                return;
            }

            $this->add(
                'GL account references',
                'GL',
                (string) $orphans . ' orphan(s)',
                'error',
                $orphans . ' GL posting account code(s) not found in chart of accounts.'
            );
        } catch (\Throwable $e) {
            $this->add('GL account references', 'GL', 'Check failed', 'warning', $e->getMessage());
        }
    }
}
