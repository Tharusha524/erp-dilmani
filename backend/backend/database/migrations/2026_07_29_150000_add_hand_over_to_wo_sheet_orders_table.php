<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * "Verify" now only unlocks the Hand Over button — Hand Over is the
     * new signal that an order is actually complete.
     */
    public function up(): void
    {
        Schema::table('wo_sheet_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('final_hand_over_user_id')->nullable()->after('final_verify_date');
            $table->dateTime('final_hand_over_date')->nullable()->after('final_hand_over_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('wo_sheet_orders', function (Blueprint $table) {
            $table->dropColumn(['final_hand_over_user_id', 'final_hand_over_date']);
        });
    }
};
