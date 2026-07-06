<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration only marks that the composite key issue exists.
     * We cannot add a unique constraint because there are already duplicates.
     */
    public function up(): void
    {
        // The debtor_trans table has duplicate (trans_no, trans_type) combinations
        // so we cannot add a unique constraint. Instead, we'll handle this in the
        // foreign key definition in debtor_trans_details by only checking trans_no.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No changes to reverse
    }
};
