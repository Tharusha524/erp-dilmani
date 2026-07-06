<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('email', 120)->nullable()->index();
            $table->string('full_name', 120)->nullable();
            $table->string('user_role', 80)->nullable();
            $table->string('activity_type', 40)->index();
            $table->string('module', 80)->nullable()->index();
            $table->string('entity_label', 255)->nullable();
            $table->string('entity_id', 64)->nullable();
            $table->string('http_method', 10)->nullable();
            $table->string('route', 255)->nullable();
            $table->text('description')->nullable();
            $table->boolean('success')->default(true)->index();
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->string('ip_address', 45)->nullable()->index();
            $table->string('ip_country', 80)->nullable();
            $table->string('ip_region', 120)->nullable();
            $table->string('ip_city', 120)->nullable();
            $table->string('ip_isp', 120)->nullable();
            $table->string('location_summary', 255)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device_summary', 120)->nullable();
            $table->string('browser', 80)->nullable();
            $table->string('platform', 80)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->useCurrent()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_activity_logs');
    }
};
