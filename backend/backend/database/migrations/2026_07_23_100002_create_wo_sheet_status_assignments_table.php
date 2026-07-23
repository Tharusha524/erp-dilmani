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
        Schema::create('wo_sheet_status_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('status_id')->unique()
                ->constrained('wo_sheet_statuses')->cascadeOnDelete();
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wo_sheet_status_assignments');
    }
};
