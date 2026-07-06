<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entity_attachments', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type', 50);
            $table->string('entity_id', 64);
            $table->string('doc_title');
            $table->date('doc_date');
            $table->string('stored_path');
            $table->string('original_filename');
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->boolean('inactive')->default(false);
            $table->timestamps();

            $table->index(['entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entity_attachments');
    }
};
