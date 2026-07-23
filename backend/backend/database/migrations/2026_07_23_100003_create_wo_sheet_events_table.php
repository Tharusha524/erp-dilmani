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
        Schema::create('wo_sheet_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wo_sheet_order_id')
                ->constrained('wo_sheet_orders')->cascadeOnDelete();

            $table->string('event_type', 40); // status_change | reopen | quality_test | final_verify | note
            $table->text('description')->nullable();

            $table->foreignId('status_id')->nullable()
                ->constrained('wo_sheet_statuses')->nullOnDelete();
            $table->unsignedBigInteger('user_id')->nullable();

            $table->dateTime('event_datetime')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wo_sheet_events');
    }
};
