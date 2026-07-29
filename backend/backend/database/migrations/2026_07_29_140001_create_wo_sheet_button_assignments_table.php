<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Who's allowed to click Finish/Verify/Re-Open on a work order — unlike
     * status assignments, these apply globally (not per status), and
     * multiple people may be assigned to the same button from the start.
     */
    public function up(): void
    {
        Schema::create('wo_sheet_button_assignments', function (Blueprint $table) {
            $table->id();
            $table->string('button_key', 30); // 'finish' | 'verify' | 'reopen'
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
            $table->unique(['button_key', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wo_sheet_button_assignments');
    }
};
