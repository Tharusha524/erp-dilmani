<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
            ]
        );

        $this->call([
            SalesTypeSeeder::class,
            CurrencySeeder::class,
            ClassTypesSeeder::class,
            ChartClassSeeder::class,
            ChartTypesSeeder::class,
            ChartMasterSeeder::class,
            AccountTypeSeeder::class,
            PaymentTypeSeeder::class,
            CrmCategoriesSeeder::class,
            UserManagementSeeder::class,
            SecurityRolesSeeder::class,
            ItemTypeSeeder::class,
            ReflinesSeeder::class,
            TransTypesSeeder::class,
            ItemTaxTypeSeeder::class,
            ItemUnitSeeder::class,
            ItemCategorySeeder::class,
            GlTypesSeeder::class,
            TaxAlgorithmsSeeder::class,
            InvoiceIdentificationsSeeder::class,
            DepreciationPeriodsSeeder::class,
            DepreciationMethodSeeder::class,
            SalesGroupSeeder::class,
            SysPrefsSeeder::class,
            InventoryLocationsSeeder::class,
            BankAccountsSeeder::class,
            SalesPosSeeder::class,
            DebtorsSeeder::class,
            QuotationSeeder::class,
        ]);
    }
}
