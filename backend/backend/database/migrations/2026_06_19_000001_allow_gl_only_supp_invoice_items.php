<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('supp_invoice_items')) {
            return;
        }

        Schema::table('supp_invoice_items', function (Blueprint $table) {
            $table->dropForeign(['stock_id']);
        });

        Schema::table('supp_invoice_items', function (Blueprint $table) {
            $table->string('stock_id', 20)->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('supp_invoice_items')) {
            return;
        }

        Schema::table('supp_invoice_items', function (Blueprint $table) {
            $table->string('stock_id', 20)->default('')->nullable(false)->change();
            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->cascadeOnDelete();
        });
    }
};
