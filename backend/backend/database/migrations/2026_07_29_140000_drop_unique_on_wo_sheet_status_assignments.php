<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Allow multiple users to be assigned as "responsible" for the same
     * status (previously exactly one, enforced by this unique index).
     */
    public function up(): void
    {
        Schema::table('wo_sheet_status_assignments', function (Blueprint $table) {
            $table->dropForeign(['status_id']);
            $table->dropUnique(['status_id']);
            $table->foreign('status_id')->references('id')->on('wo_sheet_statuses')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('wo_sheet_status_assignments', function (Blueprint $table) {
            $table->dropForeign(['status_id']);
            $table->unique('status_id');
            $table->foreign('status_id')->references('id')->on('wo_sheet_statuses')->cascadeOnDelete();
        });
    }
};
