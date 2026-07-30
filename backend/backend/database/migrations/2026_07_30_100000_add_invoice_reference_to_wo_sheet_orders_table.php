<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Links a Factory work order back to the Direct Sales Invoice that
     * auto-created it (via matching reference number), when the invoice
     * was placed with "Create Work Order" checked.
     */
    public function up(): void
    {
        Schema::table('wo_sheet_orders', function (Blueprint $table) {
            $table->string('invoice_reference', 60)->nullable()->after('work_order_no');
        });
    }

    public function down(): void
    {
        Schema::table('wo_sheet_orders', function (Blueprint $table) {
            $table->dropColumn('invoice_reference');
        });
    }
};
