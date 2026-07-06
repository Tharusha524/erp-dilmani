<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CrmCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('crm_categories')->insertOrIgnore([
            [   
                'id' => '1',
                'type' => 'cust_branch',
                'subtype' => 'general',
                'name' => 'General',
                'description'=> 'General contact data for customer branch (overrides company setting)',
                'systm' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [   
                'id' => '2',
                'type' => 'cust_branch',
                'subtype' => 'invoice',
                'name' => 'invoices',
                'description'=> 'Invoice posting (overrides company setting)',
                'systm' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [   
                'id' => '3',
                'type' => 'cust_branch',
                'subtype' => 'order',
                'name' => 'Orders',
                'description'=> 'Order confirmation (overrides company setting)',
                'systm' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [   
                'id' => '4',
                'type' => 'cust_branch',
                'subtype' => 'delivery',
                'name' => 'Deliveries',
                'description'=> 'Delivery coordination (overrides company setting)',
                'systm' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [   
                'id' => '5',
                'type' => 'customer',
                'subtype' => 'general',
                'name' => 'General',
                'description'=> 'General contact data for customer',
                'systm' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [   
                'id' => '6',
                'type' => 'customer',
                'subtype' => 'order',
                'name' => 'Orders',
                'description'=> 'Order confirmation',
                'systm' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [   
                'id' => '7',
                'type' => 'customer',
                'subtype' => 'delivery',
                'name' => 'Deliveries',
                'description'=> 'Delivery coordination',
                'systm' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [   
                'id' => '8',
                'type' => 'customer',
                'subtype' => 'invoice',
                'name' => 'Invoices',
                'description'=> 'Invoice posting',
                'systm' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [   
                'id' => '9',
                'type' => 'supplier',
                'subtype' => 'general',
                'name' => 'General',
                'description'=> 'General contact data for supplier',
                'systm' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [   
                'id' => '10',
                'type' => 'supplier',
                'subtype' => 'order',
                'name' => 'Orders',
                'description'=> 'Order confirmation',
                'systm' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [   
                'id' => '11',
                'type' => 'supplier',
                'subtype' => 'delivery',
                'name' => 'Deliveries',
                'description'=> 'Delivery coordination',
                'systm' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [   
                'id' => '12',
                'type' => 'supplier',
                'subtype' => 'invoice',
                'name' => 'Invoices',
                'description'=> 'Invoice posting',
                'systm' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
