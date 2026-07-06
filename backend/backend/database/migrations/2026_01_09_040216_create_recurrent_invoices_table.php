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
        Schema::create('recurrent_invoices', function (Blueprint $table) {
            $table->smallIncrements('id'); // smallint unsigned, PK, auto increment

            $table->string('description', 60)->unique();
            $table->unsignedInteger('order_no');

            $table->unsignedInteger('debtor_no')->nullable();
            $table->unsignedSmallInteger('group_no')->nullable();

            $table->integer('days')->default(0);
            $table->integer('monthly')->default(0);

            $table->date('begin');
            $table->date('end');
            $table->date('last_sent');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recurrent_invoices');
    }
};
