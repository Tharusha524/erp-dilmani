<?php

use App\Support\GlAccountResolver;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sys_prefs')) {
            return;
        }

        foreach (['salesDiscountAccount', 'promptPaymentDiscountAccount'] as $name) {
            $current = DB::table('sys_prefs')->where('name', $name)->value('value');
            $resolved = GlAccountResolver::resolve($name, $current ? (string) $current : null);
            if ($resolved && $resolved !== $current) {
                DB::table('sys_prefs')->where('name', $name)->update([
                    'value' => $resolved,
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Non-destructive: keep corrected GL account mapping.
    }
};
