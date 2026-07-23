<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('wo_sheet_orders', function (Blueprint $table) {
            $table->string('branch', 100)->nullable()->after('work_order_no');
            $table->date('order_date')->nullable()->after('branch');
            $table->date('delivery_date')->nullable()->after('order_date');
            $table->string('customer', 150)->nullable()->after('delivery_date');
            $table->string('contact_no', 30)->nullable()->after('customer');
            $table->string('kind_of_fabric', 100)->nullable()->after('contact_no');

            $table->string('front_image_path')->nullable()->after('description');
            $table->string('back_image_path')->nullable()->after('front_image_path');

            $table->string('embroider_front', 100)->nullable()->after('back_image_path');
            $table->string('embroider_back', 100)->nullable()->after('embroider_front');
            $table->string('embroider_sleeves', 100)->nullable()->after('embroider_back');
            $table->string('embroider_others', 100)->nullable()->after('embroider_sleeves');

            $table->text('remark')->nullable()->after('embroider_others');

            $table->decimal('total_price', 12, 2)->nullable()->after('remark');
            $table->decimal('advance', 12, 2)->nullable()->after('total_price');
            $table->decimal('balance', 12, 2)->nullable()->after('advance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wo_sheet_orders', function (Blueprint $table) {
            $table->dropColumn([
                'branch',
                'order_date',
                'delivery_date',
                'customer',
                'contact_no',
                'kind_of_fabric',
                'front_image_path',
                'back_image_path',
                'embroider_front',
                'embroider_back',
                'embroider_sleeves',
                'embroider_others',
                'remark',
                'total_price',
                'advance',
                'balance',
            ]);
        });
    }
};
