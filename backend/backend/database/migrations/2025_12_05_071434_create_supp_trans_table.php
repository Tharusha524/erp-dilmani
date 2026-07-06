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
        Schema::create('supp_trans', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('trans_no')->index();
            $table->integer('trans_type')->default(0);
            $table->unsignedBigInteger('supplier_id');
            $table->string('reference')->default('');
            $table->string('supp_reference')->nullable();
            $table->date('trans_date')->nullable();
            $table->date('due_date')->nullable();
            $table->double('ov_amount')->default(0);
            $table->double('ov_discount')->default(0);
            $table->double('ov_gst')->default(0);
            $table->double('rate')->default(1);
            $table->double('alloc')->default(0);
            $table->boolean('tax_included')->default(0);
            $table->timestamps();

            $table->foreign('trans_type')->references('trans_type')->on('trans_types');
            $table->foreign('supplier_id')->references('supplier_id')->on('suppliers');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supp_trans');
    }
};
