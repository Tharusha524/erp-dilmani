<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_master', function (Blueprint $table) {
            $table->double('mrp_price')->nullable()->after('purchase_cost');
        });
    }

    public function down(): void
    {
        Schema::table('stock_master', function (Blueprint $table) {
            $table->dropColumn('mrp_price');
        });
    }
};
