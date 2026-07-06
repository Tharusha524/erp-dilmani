<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dimensions', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 60)->index();
            $table->string('name');
            $table->unsignedTinyInteger('type')->default(1)->comment('1=Dimension 1, 2=Dimension 2');
            $table->date('start_date')->nullable();
            $table->date('date_required_by')->nullable();
            $table->foreignId('tag_id')->nullable()->constrained('dimension_tags')->nullOnDelete();
            $table->text('memo')->nullable();
            $table->boolean('closed')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dimensions');
    }
};
