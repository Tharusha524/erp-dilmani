<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('purch_order_details') && ! Schema::hasColumn('purch_order_details', 'discount_percent')) {
            Schema::table('purch_order_details', function (Blueprint $table) {
                $table->double('discount_percent')->default(0)->after('unit_price');
            });
        }

        if (Schema::hasTable('supp_invoice_items') && ! Schema::hasColumn('supp_invoice_items', 'discount_percent')) {
            Schema::table('supp_invoice_items', function (Blueprint $table) {
                $table->double('discount_percent')->default(0)->after('unit_price');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('purch_order_details') && Schema::hasColumn('purch_order_details', 'discount_percent')) {
            Schema::table('purch_order_details', function (Blueprint $table) {
                $table->dropColumn('discount_percent');
            });
        }

        if (Schema::hasTable('supp_invoice_items') && Schema::hasColumn('supp_invoice_items', 'discount_percent')) {
            Schema::table('supp_invoice_items', function (Blueprint $table) {
                $table->dropColumn('discount_percent');
            });
        }
    }
};
