<?php

use App\Services\Auth\LoginIpRestrictionService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(LoginIpRestrictionService::class)->ensureSeeded();
    }

    public function down(): void
    {
        // Keep security settings if rolled back.
    }
};
