<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id('quotation_id');
            $table->string('quotation_number')->unique();
            $table->integer('trans_type')->index();
            $table->unsignedBigInteger('debtor_no');
            $table->string('branch_code')->nullable();
            $table->string('reference')->nullable();
            $table->string('customer_ref')->nullable();
            $table->longText('comments')->nullable();
            $table->dateTime('quotation_date');
            $table->dateTime('delivery_date')->nullable();
            $table->string('ship_via')->nullable();
            $table->longText('delivery_address')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->decimal('freight_cost', 15, 2)->default(0);
            $table->string('from_stk_loc')->nullable();
            $table->string('payment_terms')->nullable();
            $table->decimal('total', 15, 2)->default(0);
            $table->enum('status', ['draft', 'sent', 'accepted', 'rejected', 'expired'])->default('draft');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('trans_type')->references('trans_type')->on('trans_types');
            $table->foreign('debtor_no')->references('debtor_no')->on('debtors_master');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index('quotation_number');
            $table->index('debtor_no');
            $table->index('status');
            $table->index('quotation_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
