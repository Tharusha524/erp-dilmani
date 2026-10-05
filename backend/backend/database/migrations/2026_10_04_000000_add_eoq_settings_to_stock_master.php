<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_master', function (Blueprint $table) {
            // EOQ = sqrt(2 * annual demand * ordering cost / annual holding cost
            // per unit). Annual demand comes from actual sales history (Low
            // Stock's existing avg-daily-sales calculation x365) — these two
            // are the only inputs that have to be set manually per item.
            $table->double('eoq_ordering_cost')->nullable()->after('wholesale_price');
            $table->double('eoq_holding_cost_percent')->nullable()->after('eoq_ordering_cost');
        });
    }

    public function down(): void
    {
        Schema::table('stock_master', function (Blueprint $table) {
            $table->dropColumn(['eoq_ordering_cost', 'eoq_holding_cost_percent']);
        });
    }
};
