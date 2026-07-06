<?php

use App\Services\Auth\LoginActivitySyncService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(LoginActivitySyncService::class)->backfillAll();
    }

    public function down(): void
    {
        // Historical login rows are merged into user_activity_logs; no safe automatic rollback.
    }
};
