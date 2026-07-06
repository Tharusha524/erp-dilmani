<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budget_trans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fiscal_year_id');
            $table->string('account', 15);
            $table->unsignedBigInteger('dimension_id')->default(0);
            $table->date('tran_date');
            $table->double('amount')->default(0);
            $table->timestamps();
            $table->unique(['fiscal_year_id', 'account', 'dimension_id', 'tran_date'], 'budget_trans_unique');
            $table->index(['fiscal_year_id', 'account']);
        });

        Schema::create('quick_entries', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60);
            $table->string('description', 120)->nullable();
            $table->string('usage', 255)->nullable();
            $table->string('entry_type', 40)->default('Journal');
            $table->string('base_amount_description', 120)->nullable();
            $table->double('default_base_amount')->default(0);
            $table->string('destination_account', 15)->nullable();
            $table->timestamps();
        });

        Schema::create('printers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60);
            $table->string('description', 120)->nullable();
            $table->string('host', 120)->nullable();
            $table->string('port', 20)->nullable();
            $table->string('queue', 60)->nullable();
            $table->unsignedInteger('timeout')->default(30);
            $table->timestamps();
        });

        Schema::create('app_languages', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name', 80);
            $table->string('version', 20)->nullable();
            $table->boolean('installed')->default(false);
            $table->timestamps();
        });

        Schema::create('app_themes', function (Blueprint $table) {
            $table->id();
            $table->string('theme_key', 60)->unique();
            $table->string('name', 80);
            $table->string('version', 20)->nullable();
            $table->boolean('installed')->default(false);
            $table->timestamps();
        });

        Schema::create('app_extensions', function (Blueprint $table) {
            $table->id();
            $table->string('extension_key', 60)->unique();
            $table->string('name', 80);
            $table->string('version', 20)->nullable();
            $table->boolean('installed')->default(false);
            $table->timestamps();
        });

        \Illuminate\Support\Facades\DB::table('app_languages')->insert([
            ['code' => 'en', 'name' => 'English', 'version' => '1.0', 'installed' => true, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'ar', 'name' => 'Arabic', 'version' => '1.0', 'installed' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);
        \Illuminate\Support\Facades\DB::table('app_themes')->insert([
            ['theme_key' => 'default', 'name' => 'Default Theme', 'version' => '1.0', 'installed' => true, 'created_at' => now(), 'updated_at' => now()],
            ['theme_key' => 'dark', 'name' => 'Dark Theme', 'version' => '1.0', 'installed' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);
        \Illuminate\Support\Facades\DB::table('app_extensions')->insert([
            ['extension_key' => 'core', 'name' => 'Core ERP', 'version' => '1.0', 'installed' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('app_extensions');
        Schema::dropIfExists('app_themes');
        Schema::dropIfExists('app_languages');
        Schema::dropIfExists('printers');
        Schema::dropIfExists('quick_entries');
        Schema::dropIfExists('budget_trans');
    }
};
