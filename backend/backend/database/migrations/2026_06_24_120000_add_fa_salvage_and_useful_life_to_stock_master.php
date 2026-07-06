<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('stock_master')) {
            return;
        }

        Schema::table('stock_master', function (Blueprint $table) {
            if (! Schema::hasColumn('stock_master', 'salvage_value')) {
                $table->double('salvage_value')->default(0)->after('purchase_cost');
            }
            if (! Schema::hasColumn('stock_master', 'useful_life_years')) {
                $table->unsignedSmallInteger('useful_life_years')->default(0)->after('salvage_value');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('stock_master')) {
            return;
        }

        Schema::table('stock_master', function (Blueprint $table) {
            if (Schema::hasColumn('stock_master', 'useful_life_years')) {
                $table->dropColumn('useful_life_years');
            }
            if (Schema::hasColumn('stock_master', 'salvage_value')) {
                $table->dropColumn('salvage_value');
            }
        });
    }
};
