<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_master', function (Blueprint $table) {
            // Quantity a cart line must exceed before the wholesale price
            // becomes eligible to apply (PIN-gated at checkout — see
            // PosSettingsController@wholesalePin), and the price it switches
            // to once applied. Both nullable: a product with neither set
            // simply has no wholesale option.
            $table->unsignedInteger('wholesale_qty_threshold')->nullable()->after('mrp_price');
            $table->double('wholesale_price')->nullable()->after('wholesale_qty_threshold');
        });
    }

    public function down(): void
    {
        Schema::table('stock_master', function (Blueprint $table) {
            $table->dropColumn(['wholesale_qty_threshold', 'wholesale_price']);
        });
    }
};
