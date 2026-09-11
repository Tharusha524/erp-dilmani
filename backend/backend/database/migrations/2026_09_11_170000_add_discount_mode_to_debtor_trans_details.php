<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('debtor_trans_details', function (Blueprint $table) {
            // How discount_percent was actually entered on this line —
            // 'percent' (typed as a %) or 'amount' (typed as a flat sum,
            // then converted to its equivalent %). Lets the invoice view/
            // print/PDF show the discount back the same way it was entered,
            // instead of always as a percentage.
            $table->string('discount_mode', 10)->default('percent')->after('discount_percent');
        });
    }

    public function down(): void
    {
        Schema::table('debtor_trans_details', function (Blueprint $table) {
            $table->dropColumn('discount_mode');
        });
    }
};
