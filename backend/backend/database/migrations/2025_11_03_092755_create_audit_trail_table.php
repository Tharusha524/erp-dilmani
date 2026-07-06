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
        Schema::create('audit_trail', function (Blueprint $table) {
            $table->id();
            $table->Integer('type')->default(0);
            $table->Integer('trans_no')->default(0);
            $table->unsignedSmallInteger('user')->default(0);
            $table->timestamp('stamp')->useCurrent()->useCurrentOnUpdate();
            $table->string('description', 60)->nullable();
            $table->unsignedBigInteger('fiscal_year')->default(0);
            $table->date('gl_date')->nullable();
            $table->unsignedInteger('gl_seq')->nullable();
            $table->timestamps();

            $table->foreign('fiscal_year')->references('id')->on('fiscal_years')->onDelete('cascade');
            $table->foreign('type')->references('trans_type')->on('reflines')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_trail');
    }
};
