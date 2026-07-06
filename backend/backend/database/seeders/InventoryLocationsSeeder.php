<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InventoryLocationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('inventory_locations')->insertOrIgnore([
            [
                'loc_code' => 'HQ',
                'location_name' => 'Headquarters',
                'delivery_address' => '123 Main Street, Suite 100',
                'phone' => '555-0100',
                'phone2' => '555-0101',
                'fax' => '555-0102',
                'email' => 'hq@company.com',
                'contact' => 'John Smith',
                'inactive' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'loc_code' => 'WH1',
                'location_name' => 'Warehouse 1',
                'delivery_address' => '456 Industrial Avenue, Building A',
                'phone' => '555-0200',
                'phone2' => '555-0201',
                'fax' => '555-0202',
                'email' => 'wh1@company.com',
                'contact' => 'Sarah Johnson',
                'inactive' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'loc_code' => 'WH2',
                'location_name' => 'Warehouse 2',
                'delivery_address' => '789 Industrial Avenue, Building B',
                'phone' => '555-0300',
                'phone2' => '555-0301',
                'fax' => '555-0302',
                'email' => 'wh2@company.com',
                'contact' => 'Mike Wilson',
                'inactive' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
