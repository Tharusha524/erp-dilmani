<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE dimensions RENAME TO cost_centers');
        DB::statement('ALTER TABLE dimension_tags RENAME TO cost_center_tags');

        DB::statement('ALTER TABLE bank_trans CHANGE dimension_id cost_center_id INT(10) UNSIGNED NULL DEFAULT NULL');
        DB::statement('ALTER TABLE bank_trans CHANGE dimension2_id cost_center2_id INT(10) UNSIGNED NULL DEFAULT NULL');

        DB::statement('ALTER TABLE budget_trans CHANGE dimension_id cost_center_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE budget_trans CHANGE dimension2_id cost_center2_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0');

        DB::statement('ALTER TABLE debtors_master CHANGE dimension_id cost_center_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE debtors_master CHANGE dimension2_id cost_center2_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0');

        DB::statement('ALTER TABLE debtor_trans CHANGE dimension_id cost_center_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE debtor_trans CHANGE dimension2_id cost_center2_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0');

        DB::statement('ALTER TABLE stock_master CHANGE dimension_id cost_center_id BIGINT(20) UNSIGNED NULL DEFAULT NULL');
        DB::statement('ALTER TABLE stock_master CHANGE dimension2_id cost_center2_id BIGINT(20) UNSIGNED NULL DEFAULT NULL');

        DB::statement('ALTER TABLE suppliers CHANGE dimension_id cost_center_id INT(11) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE suppliers CHANGE dimension2_id cost_center2_id INT(11) NOT NULL DEFAULT 0');

        DB::statement('ALTER TABLE supp_invoice_items CHANGE dimension_id cost_center_id INT(11) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE supp_invoice_items CHANGE dimension2_id cost_center2_id INT(11) NOT NULL DEFAULT 0');

        DB::statement('ALTER TABLE gl_trans CHANGE dimension cost_center_id BIGINT(20) UNSIGNED NULL DEFAULT NULL');

        DB::statement('ALTER TABLE company_setup CHANGE use_dimensions use_cost_centers INT(11) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE company_setup CHANGE use_dimensions_on_recurrent_invoices use_cost_centers_on_recurrent_invoices TINYINT(1) NOT NULL DEFAULT 0');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE company_setup CHANGE use_cost_centers_on_recurrent_invoices use_dimensions_on_recurrent_invoices TINYINT(1) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE company_setup CHANGE use_cost_centers use_dimensions INT(11) NOT NULL DEFAULT 0');

        DB::statement('ALTER TABLE gl_trans CHANGE cost_center_id dimension BIGINT(20) UNSIGNED NULL DEFAULT NULL');

        DB::statement('ALTER TABLE supp_invoice_items CHANGE cost_center2_id dimension2_id INT(11) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE supp_invoice_items CHANGE cost_center_id dimension_id INT(11) NOT NULL DEFAULT 0');

        DB::statement('ALTER TABLE suppliers CHANGE cost_center2_id dimension2_id INT(11) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE suppliers CHANGE cost_center_id dimension_id INT(11) NOT NULL DEFAULT 0');

        DB::statement('ALTER TABLE stock_master CHANGE cost_center2_id dimension2_id BIGINT(20) UNSIGNED NULL DEFAULT NULL');
        DB::statement('ALTER TABLE stock_master CHANGE cost_center_id dimension_id BIGINT(20) UNSIGNED NULL DEFAULT NULL');

        DB::statement('ALTER TABLE debtor_trans CHANGE cost_center2_id dimension2_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE debtor_trans CHANGE cost_center_id dimension_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0');

        DB::statement('ALTER TABLE debtors_master CHANGE cost_center2_id dimension2_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE debtors_master CHANGE cost_center_id dimension_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0');

        DB::statement('ALTER TABLE budget_trans CHANGE cost_center2_id dimension2_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE budget_trans CHANGE cost_center_id dimension_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0');

        DB::statement('ALTER TABLE bank_trans CHANGE cost_center2_id dimension2_id INT(10) UNSIGNED NULL DEFAULT NULL');
        DB::statement('ALTER TABLE bank_trans CHANGE cost_center_id dimension_id INT(10) UNSIGNED NULL DEFAULT NULL');

        DB::statement('ALTER TABLE cost_center_tags RENAME TO dimension_tags');
        DB::statement('ALTER TABLE cost_centers RENAME TO dimensions');
    }
};
