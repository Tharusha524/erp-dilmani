<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wo_sheet_factory_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->timestamps();
        });

        // Carry over the categories that were previously hardcoded in the
        // Factory order sheet's Category dropdown, so existing behaviour
        // doesn't change for anyone until they add more from Settings.
        $now = now();
        foreach (['Sublimation T-Shirt', 'Polo T-Shirt'] as $name) {
            DB::table('wo_sheet_factory_categories')->insert([
                'name' => $name,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('wo_sheet_factory_categories');
    }
};
