<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * `strict_access` gates whether a user's page/menu access is actually
     * enforced by their Role/Individual Access permissions. It defaults to
     * false so every existing user keeps today's open behaviour unchanged;
     * only users created after this migration get strict enforcement.
     */
    public function up(): void
    {
        Schema::table('user_managements', function (Blueprint $table) {
            $table->boolean('strict_access')->default(false)->after('areas');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_managements', function (Blueprint $table) {
            $table->dropColumn('strict_access');
        });
    }
};
