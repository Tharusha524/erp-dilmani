<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purch_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('cost_center_id')->nullable()->default(0);
        });

        Schema::table('grn_batch', function (Blueprint $table) {
            $table->unsignedBigInteger('cost_center_id')->nullable()->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grn_batch', function (Blueprint $table) {
            $table->dropColumn('cost_center_id');
        });

        Schema::table('purch_orders', function (Blueprint $table) {
            $table->dropColumn('cost_center_id');
        });
    }
};
