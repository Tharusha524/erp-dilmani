<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds performance indexes across high-traffic ERP tables.
 * Safe to re-run: skips indexes that already exist.
 */
return new class extends Migration
{
    /** @var list<array{0: string, 1: array<int, string>|string, 2: string}> */
    private array $indexes = [
        // General ledger
        ['gl_trans', ['type', 'type_no'], 'idx_gl_trans_type_type_no'],
        ['gl_trans', ['account', 'date'], 'idx_gl_trans_account_date'],
        ['gl_trans', 'tran_date', 'idx_gl_trans_tran_date'],
        ['gl_trans', ['type_no', 'type'], 'idx_gl_trans_type_no_type'],

        // Inventory
        ['stock_moves', 'trans_no', 'idx_stock_moves_trans_no'],
        ['stock_moves', ['stock_id', 'loc_code'], 'idx_stock_moves_stock_loc'],
        ['stock_moves', 'tran_date', 'idx_stock_moves_tran_date'],
        ['stock_moves', ['type', 'trans_no'], 'idx_stock_moves_type_trans'],

        // Sales
        ['debtor_trans', ['debtor_no', 'tran_date'], 'idx_debtor_trans_debtor_date'],
        ['debtor_trans', 'tran_date', 'idx_debtor_trans_tran_date'],
        ['debtor_trans', 'reference', 'idx_debtor_trans_reference'],
        ['debtor_trans', 'trans_type', 'idx_debtor_trans_trans_type'],
        ['debtor_trans_details', ['debtor_trans_no', 'debtor_trans_type'], 'idx_debtor_trans_details_no_type'],
        ['debtor_trans_details', 'stock_id', 'idx_debtor_trans_details_stock'],
        ['sales_orders', 'debtor_no', 'idx_sales_orders_debtor_no'],
        ['sales_orders', 'ord_date', 'idx_sales_orders_ord_date'],
        ['sales_orders', 'reference', 'idx_sales_orders_reference'],
        ['sales_order_details', 'stk_code', 'idx_sales_order_details_stk_code'],

        // Purchasing
        ['supp_trans', ['trans_no', 'trans_type'], 'idx_supp_trans_no_type'],
        ['supp_trans', ['supplier_id', 'trans_date'], 'idx_supp_trans_supplier_date'],
        ['supp_trans', 'trans_date', 'idx_supp_trans_trans_date'],
        ['purch_orders', 'supplier_id', 'idx_purch_orders_supplier_id'],
        ['purch_orders', 'ord_date', 'idx_purch_orders_ord_date'],
        ['purch_order_details', 'order_no', 'idx_purch_order_details_order_no'],
        ['purch_order_details', 'item_code', 'idx_purch_order_details_item_code'],
        ['grn_batch', 'supplier_id', 'idx_grn_batch_supplier_id'],
        ['grn_batch', 'delivery_date', 'idx_grn_batch_delivery_date'],
        ['grn_batch', 'purch_order_no', 'idx_grn_batch_purch_order_no'],
        ['grn_items', 'grn_batch_id', 'idx_grn_items_grn_batch_id'],

        // Banking & journals
        ['bank_trans', 'bank_act', 'idx_bank_trans_bank_act'],
        ['bank_trans', ['trans_no', 'type'], 'idx_bank_trans_trans_no_type'],
        ['bank_trans', 'trans_date', 'idx_bank_trans_trans_date'],
        ['journal', ['type', 'trans_no'], 'idx_journal_type_trans_no'],
        ['journal', 'tran_date', 'idx_journal_tran_date'],
        ['journal', 'reference', 'idx_journal_reference'],

        // Allocations
        ['cust_allocations', 'person_id', 'idx_cust_alloc_person_id'],
        ['supp_allocations', 'person_id', 'idx_supp_alloc_person_id'],
        ['supp_allocations', ['trans_no_from', 'trans_type_from'], 'idx_supp_alloc_from'],
        ['supp_allocations', ['trans_no_to', 'trans_type_to'], 'idx_supp_alloc_to'],

        // Manufacturing
        ['workorders', 'stock_id', 'idx_workorders_stock_id'],
        ['workorders', 'loc_code', 'idx_workorders_loc_code'],
        ['workorders', 'date', 'idx_workorders_date'],
        ['workorders', 'wo_ref', 'idx_workorders_wo_ref'],
        ['wo_issues', 'workorder_id', 'idx_wo_issues_workorder_id'],
        ['wo_manufacture', 'workorder_id', 'idx_wo_manufacture_workorder_id'],

        // CRM / master data
        ['debtors_master', 'name', 'idx_debtors_master_name'],
        ['suppliers', 'supp_name', 'idx_suppliers_supp_name'],
        ['cust_branch', 'debtor_no', 'idx_cust_branch_debtor_no'],

        // System
        ['comments', ['type', 'id'], 'idx_comments_type_id'],
        ['audit_trail', ['type', 'trans_no'], 'idx_audit_trail_type_trans'],
        ['audit_trail', 'stamp', 'idx_audit_trail_stamp'],
        ['audit_trail', 'user', 'idx_audit_trail_user'],
        ['sys_prefs', 'category', 'idx_sys_prefs_category'],
        ['user_managements', 'role', 'idx_user_managements_role'],
        ['user_managements', 'status', 'idx_user_managements_status'],
        ['personal_access_tokens', ['tokenable_id', 'tokenable_type'], 'idx_pat_tokenable'],
        ['entity_attachments', 'doc_date', 'idx_entity_attachments_doc_date'],
    ];

    public function up(): void
    {
        foreach ($this->indexes as [$table, $columns, $indexName]) {
            $this->addIndexIfMissing($table, $columns, $indexName);
        }
    }

    public function down(): void
    {
        foreach ($this->indexes as [$table, $columns, $indexName]) {
            $this->dropIndexIfExists($table, $indexName);
        }
    }

    /**
     * @param  array<int, string>|string  $columns
     */
    private function addIndexIfMissing(string $table, array|string $columns, string $indexName): void
    {
        if (! $this->hasRequiredColumns($table, $columns) || $this->indexExists($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($columns, $indexName) {
            $blueprint->index($columns, $indexName);
        });
    }

    private function dropIndexIfExists(string $table, string $indexName): void
    {
        if (! Schema::hasTable($table) || ! $this->indexExists($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($indexName) {
            $blueprint->dropIndex($indexName);
        });
    }

    /**
     * @param  array<int, string>|string  $columns
     */
    private function hasRequiredColumns(string $table, array|string $columns): bool
    {
        if (! Schema::hasTable($table)) {
            return false;
        }

        $cols = is_array($columns) ? $columns : [$columns];

        foreach ($cols as $column) {
            if (! Schema::hasColumn($table, $column)) {
                return false;
            }
        }

        return true;
    }

    private function indexExists(string $table, string $indexName): bool
    {
        if (! Schema::hasTable($table)) {
            return false;
        }

        $rows = Schema::getConnection()->select(
            'SHOW INDEX FROM `'.$table.'` WHERE Key_name = ?',
            [$indexName]
        );

        return count($rows) > 0;
    }
};
