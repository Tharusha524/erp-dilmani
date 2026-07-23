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
        Schema::create('wo_sheet_orders', function (Blueprint $table) {
            $table->id();
            $table->string('work_order_no', 60)->unique();
            $table->text('description')->nullable();

            $table->dateTime('server_datetime')->nullable();

            $table->string('factory_code', 30)->nullable();
            $table->string('related_department', 100)->nullable();

            $table->string('category', 100); // e.g. T-shirt
            $table->string('sub_category', 100)->nullable();

            $table->string('department', 100)->nullable(); // maker's department

            $table->unsignedBigInteger('created_user_id')->nullable();
            $table->unsignedBigInteger('allocated_user_id')->nullable();

            $table->string('machine_category', 100)->nullable();
            $table->string('machine_category_no', 60)->nullable();
            $table->string('value_add', 100)->nullable();

            $table->unsignedInteger('order_quantity')->nullable();
            $table->string('process_type', 20)->default('normal'); // normal (<=200 pcs) | bulk (>200 pcs)

            $table->foreignId('current_status_id')->nullable()
                ->constrained('wo_sheet_statuses')->nullOnDelete();

            $table->unsignedBigInteger('quality_tester_user_id')->nullable();
            $table->dateTime('quality_test_time')->nullable();

            $table->unsignedBigInteger('final_verify_user_id')->nullable();
            $table->dateTime('final_verify_date')->nullable();

            $table->dateTime('reopen_datetime')->nullable();

            $table->timestamps(); // created_at doubles as "created date time"
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wo_sheet_orders');
    }
};
