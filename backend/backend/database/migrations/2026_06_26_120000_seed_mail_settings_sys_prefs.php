<?php

use App\Services\Mail\MailSettingsService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(MailSettingsService::class)->ensureSeeded();
    }

    public function down(): void
    {
        // Keep mail settings if rolled back.
    }
};
