<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('wo_sheet_statuses', function (Blueprint $table) {
            $table->string('category', 50)->nullable()->after('name'); // sublimation_tshirt | polo_tshirt
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wo_sheet_statuses', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
