<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('debtors_master', function (Blueprint $table) {
            if (! Schema::hasColumn('debtors_master', 'password')) {
                $table->string('password')->nullable()->after('email');
            }
            if (! Schema::hasColumn('debtors_master', 'mobile_verified_at')) {
                $table->timestamp('mobile_verified_at')->nullable()->after('password');
            }
            if (! Schema::hasColumn('debtors_master', 'remember_token')) {
                $table->rememberToken();
            }
        });
    }

    public function down(): void
    {
        Schema::table('debtors_master', function (Blueprint $table) {
            $table->dropColumn(['password', 'mobile_verified_at', 'remember_token']);
        });
    }
};
