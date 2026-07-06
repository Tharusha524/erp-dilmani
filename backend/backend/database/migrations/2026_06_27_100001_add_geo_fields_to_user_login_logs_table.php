<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_login_logs', function (Blueprint $table) {
            $table->string('ip_country', 80)->nullable()->after('ip_address');
            $table->string('ip_region', 120)->nullable()->after('ip_country');
            $table->string('ip_city', 120)->nullable()->after('ip_region');
            $table->string('ip_isp', 120)->nullable()->after('ip_city');
            $table->string('location_summary', 255)->nullable()->after('ip_isp');
        });
    }

    public function down(): void
    {
        Schema::table('user_login_logs', function (Blueprint $table) {
            $table->dropColumn([
                'ip_country',
                'ip_region',
                'ip_city',
                'ip_isp',
                'location_summary',
            ]);
        });
    }
};
