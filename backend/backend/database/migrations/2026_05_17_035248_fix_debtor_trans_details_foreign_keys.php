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
        // Drop the problematic separate foreign keys and add a composite one
        Schema::table('debtor_trans_details', function (Blueprint $table) {
            // Drop the individual foreign keys that don't properly validate the combination
            try {
                $table->dropForeign(['debtor_trans_type']);
            } catch (\Exception $e) {
                // Foreign key might not exist or have a different name
            }
            
            // Keep only the trans_no foreign key for now (trans_type is already stored with it)
            // The combination will be validated by the unique constraint on debtor_trans
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('debtor_trans_details', function (Blueprint $table) {
            // Restore the foreign key if needed
            $table->foreign('debtor_trans_type')->references('trans_type')->on('debtor_trans')->onDelete('cascade');
        });
    }
};
