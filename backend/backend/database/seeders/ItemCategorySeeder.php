<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ItemCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('item_category')->insertOrIgnore([
            [
                'category_id' => '1',
                'description' => 'Components',
                'dflt_tax_type' => 1,
                'dflt_units' => 1,
                'dflt_mb_flag' => 2,
                'dflt_sales_act' => 4010,
                'dflt_cogs_act' => 5010,
                'dflt_inventory_act' => 1510,
                'dflt_adjustment_act' => 5040,
                'dflt_wip_act' => 1530,
                'dflt_dim1' => null,
                'dflt_dim2' => null,
                'inactive' => 0,
                'dflt_no_sale' => 0,
                'dflt_no_purchase' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_id' => '2',
                'description' => 'Charges',
                'dflt_tax_type' => 1,
                'dflt_units' => 1,
                'dflt_mb_flag' => 3,
                'dflt_sales_act' => 4010,
                'dflt_cogs_act' => 5010,
                'dflt_inventory_act' => 1510,
                'dflt_adjustment_act' => 5040,
                'dflt_wip_act' => 1530,
                'dflt_dim1' => null,
                'dflt_dim2' => null,
                'inactive' => 0,
                'dflt_no_sale' => 0,
                'dflt_no_purchase' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_id' => '3',
                'description' => 'Systems',
                'dflt_tax_type' => 1,
                'dflt_units' => 1,
                'dflt_mb_flag' => 1,
                'dflt_sales_act' => 4010,
                'dflt_cogs_act' => 5010,
                'dflt_inventory_act' => 1510,
                'dflt_adjustment_act' => 5040,
                'dflt_wip_act' => 1530,
                'dflt_dim1' => null,
                'dflt_dim2' => null,
                'inactive' => 0,
                'dflt_no_sale' => 0,
                'dflt_no_purchase' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_id' => '4',
                'description' => 'Services',
                'dflt_tax_type' => 1,
                'dflt_units' => 2,
                'dflt_mb_flag' => 3,
                'dflt_sales_act' => 4010,
                'dflt_cogs_act' => 5010,
                'dflt_inventory_act' => 1510,
                'dflt_adjustment_act' => 5040,
                'dflt_wip_act' => 1530,
                'dflt_dim1' => null,
                'dflt_dim2' => null,
                'inactive' => 0,
                'dflt_no_sale' => 0,
                'dflt_no_purchase' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
