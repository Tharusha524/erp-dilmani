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
        Schema::create('tax_types', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->decimal('default_rate', 5, 2)->default(0);
            $table->string('sales_gl_account');
            $table->string('purchasing_gl_account');
            $table->boolean('inactive')->default(0);
            $table->timestamps();

            $table->foreign('sales_gl_account')->references('account_code')->on('chart_master')->onDelete('cascade');
            $table->foreign('purchasing_gl_account')->references('account_code')->on('chart_master')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_types');
    }
};
