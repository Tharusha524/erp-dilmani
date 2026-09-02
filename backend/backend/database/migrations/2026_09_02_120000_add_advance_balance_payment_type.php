<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $exists = DB::table('payment_types')->where('name', 'Advance + Balance')->exists();
        if (!$exists) {
            DB::table('payment_types')->insert([
                'name' => 'Advance + Balance',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('payment_types')->where('name', 'Advance + Balance')->delete();
    }
};
