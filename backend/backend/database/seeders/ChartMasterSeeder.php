<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChartMasterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('chart_master')->insertOrIgnore([
            [
                'account_code' => '1060',
                'account_code2' => '',
                'account_name' => 'Checking Account',
                'account_type' => '1',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '1065',
                'account_code2' => '',
                'account_name' => 'Petty Cash',
                'account_type' => '1',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '1200',
                'account_code2' => '',
                'account_name' => 'Accounts Receivables',
                'account_type' => '1',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '1205',
                'account_code2' => '',
                'account_name' => 'Allowance for doubtful accounts',
                'account_type' => '1', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '1510',
                'account_code2' => '',
                'account_name' => 'Inventory',
                'account_type' => '2', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '1520',
                'account_code2' => '',
                'account_name' => 'Stocks of Raw Materials',
                'account_type' => '2', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '1530',
                'account_code2' => '',
                'account_name' => 'Stocks of Work In Progress',
                'account_type' => '2', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '1540',
                'account_code2' => '',
                'account_name' => 'Stocks of Finished Goods',
                'account_type' => '2', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '1550',
                'account_code2' => '',
                'account_name' => 'Goods Received Clearing account',
                'account_type' => '2', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '1820',
                'account_code2' => '',
                'account_name' => 'Office Furniture &amp; Equipment',
                'account_type' => '3', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '1825',
                'account_code2' => '',
                'account_name' => 'Accum. Amort. -Furn. &amp; Equip',
                'account_type' => '3', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '1840',
                'account_code2' => '',
                'account_name' => 'Vehicle',
                'account_type' => '3', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '1845',
                'account_code2' => '',
                'account_name' => 'Accum. Amort. -Vehicle',
                'account_type' => '3', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2100',
                'account_code2' => '',
                'account_name' => 'Accounts Payable',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2105',
                'account_code2' => '',
                'account_name' => 'Deferred Income',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2110',
                'account_code2' => '',
                'account_name' => 'Accrued Income Tax - Federal',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2120',
                'account_code2' => '',
                'account_name' => 'Accrued Income Tax - State',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2130',
                'account_code2' => '',
                'account_name' => 'Accrued Franchise Tax',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2140',
                'account_code2' => '',
                'account_name' => 'Accrued Real &amp; Personal Prop Tax',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2150',
                'account_code2' => '',
                'account_name' => 'Sales Tax',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2160',
                'account_code2' => '',
                'account_name' => 'Accrued Use Tax Payable',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2210',
                'account_code2' => '',
                'account_name' => 'Accrued Wages',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2220',
                'account_code2' => '',
                'account_name' => 'Accrued Comp Time',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2230',
                'account_code2' => '',
                'account_name' => 'Accrued Holiday Pay',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2240',
                'account_code2' => '',
                'account_name' => 'Accrued Vacation Pay',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2310',
                'account_code2' => '',
                'account_name' => 'Accr. Benefits - 401K',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2320',
                'account_code2' => '',
                'account_name' => 'Accr. Benefits - Stock Purchase',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2330',
                'account_code2' => '',
                'account_name' => 'Accr. Benefits - Med, Den',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2340',
                'account_code2' => '',
                'account_name' => 'Accr. Benefits - Payroll Taxes',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2350',
                'account_code2' => '',
                'account_name' => 'Accr. Benefits - Credit Union',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2360',
                'account_code2' => '',
                'account_name' => 'Accr. Benefits - Savings Bond',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2370',
                'account_code2' => '',
                'account_name' => 'Accr. Benefits - Garnish',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2380',
                'account_code2' => '',
                'account_name' => 'Accr. Benefits - Charity Cont.',
                'account_type' => '4', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2620',
                'account_code2' => '',
                'account_name' => 'Bank Loans',
                'account_type' => '5', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '2680',
                'account_code2' => '',
                'account_name' => 'Loans from Shareholders',
                'account_type' => '5', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '3350',
                'account_code2' => '',
                'account_name' => 'Common Shares',
                'account_type' => '6', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '3590',
                'account_code2' => '',
                'account_name' => 'Retained Earnings - prior years',
                'account_type' => '7', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '4010',
                'account_code2' => '',
                'account_name' => 'Sales',
                'account_type' => '8', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '4430',
                'account_code2' => '',
                'account_name' => 'Shipping &amp; Handling',
                'account_type' => '9', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '4440',
                'account_code2' => '',
                'account_name' => 'Interest',
                'account_type' => '9', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '4450',
                'account_code2' => '',
                'account_name' => 'Foreign Exchange Gain',
                'account_type' => '9', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '4500',
                'account_code2' => '',
                'account_name' => 'Prompt Payment Discounts',
                'account_type' => '9', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '4510',
                'account_code2' => '',
                'account_name' => 'Discounts Given',
                'account_type' => '9', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5010',
                'account_code2' => '',
                'account_name' => 'Cost of Goods Sold - Retail',
                'account_type' => '10', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5020',
                'account_code2' => '',
                'account_name' => 'Material Usage Varaiance',
                'account_type' => '10', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5030',
                'account_code2' => '',
                'account_name' => 'Consumable Materials',
                'account_type' => '10', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5040',
                'account_code2' => '',
                'account_name' => 'Purchase price Variance',
                'account_type' => '10', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5050',
                'account_code2' => '',
                'account_name' => 'Purchases of materials',
                'account_type' => '10', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5060',
                'account_code2' => '',
                'account_name' => 'Discounts Received',
                'account_type' => '10', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5100',
                'account_code2' => '',
                'account_name' => 'Freight',
                'account_type' => '10', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5410',
                'account_code2' => '',
                'account_name' => 'Wages &amp; Salaries',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5420',
                'account_code2' => '',
                'account_name' => 'Wages - Overtime',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5430',
                'account_code2' => '',
                'account_name' => 'Benefits - Comp Time',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5440',
                'account_code2' => '',
                'account_name' => 'Benefits - Payroll Taxes',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5450',
                'account_code2' => '',
                'account_name' => 'Benefits - Workers Comp',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5460',
                'account_code2' => '',
                'account_name' => 'Benefits - Pension',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5470',
                'account_code2' => '',
                'account_name' => 'Benefits - General Benefits',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5510',
                'account_code2' => '',
                'account_name' => 'Inc Tax Exp - Federal',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5520',
                'account_code2' => '',
                'account_name' => 'Inc Tax Exp - State',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5530',
                'account_code2' => '',
                'account_name' => 'Taxes - Real Estate',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5540',
                'account_code2' => '',
                'account_name' => 'Taxes - Personal Property',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5550',
                'account_code2' => '',
                'account_name' => 'Taxes - Franchise',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5560',
                'account_code2' => '',
                'account_name' => 'Taxes - Foreign Withholding',
                'account_type' => '11', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5610',
                'account_code2' => '',
                'account_name' => 'Accounting &amp; Legal',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5615',
                'account_code2' => '',
                'account_name' => 'Advertising &amp; Promotions',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5620',
                'account_code2' => '',
                'account_name' => 'Bad Debts',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5660',
                'account_code2' => '',
                'account_name' => 'Amortization Expense',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5685',
                'account_code2' => '',
                'account_name' => 'Insurance',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5690',
                'account_code2' => '',
                'account_name' => 'Interest &amp; Bank Charges',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5700',
                'account_code2' => '',
                'account_name' => 'Office Supplies',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5760',
                'account_code2' => '',
                'account_name' => 'Rent',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5765',
                'account_code2' => '',
                'account_name' => 'Repair &amp; Maintenance',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5780',
                'account_code2' => '',
                'account_name' => 'Telephone',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5785',
                'account_code2' => '',
                'account_name' => 'Travel &amp; Entertainment',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5790',
                'account_code2' => '',
                'account_name' => 'Utilities',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5795',
                'account_code2' => '',
                'account_name' => 'Registrations',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5800',
                'account_code2' => '',
                'account_name' => 'Licenses',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '5810',
                'account_code2' => '',
                'account_name' => 'Foreign Exchange Loss',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'account_code' => '9990',
                'account_code2' => '',
                'account_name' => 'Year Profit/Loss',
                'account_type' => '12', // must exist in chart_types
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
