<?php

namespace Database\Seeders;

use App\Models\Quotation;
use App\Models\QuotationDetail;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuotationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if debtors exist using DB::table
        $debtorExists = DB::table('debtors_master')->first();
        
        if (!$debtorExists) {
            $this->command->warn('No debtors found. Skipping quotation seeding.');
            return;
        }

        try {
            // Create sample quotation
            $quotation = Quotation::create([
                'quotation_number' => 'QT-' . date('Ymd') . '-001',
                'trans_type' => 1,
                'debtor_no' => $debtorExists->debtor_no,
                'reference' => 'REF-001',
                'customer_ref' => 'CUST-REF-001',
                'comments' => 'This is a sample quotation for testing the print functionality.',
                'quotation_date' => now(),
                'delivery_date' => now()->addDays(7),
                'contact_phone' => '+1234567890',
                'contact_email' => 'customer@example.com',
                'freight_cost' => 50.00,
                'total' => 1950.00,
                'status' => 'draft',
                'created_by' => 1,
                'updated_by' => 1,
            ]);

            // Only add details if stock items exist
            $stocks = DB::table('stock_master')->limit(2)->get();
            if ($stocks->count() >= 2) {
                QuotationDetail::create([
                    'quotation_id' => $quotation->quotation_id,
                    'trans_type' => 1,
                    'stk_code' => $stocks[0]->stock_id,
                    'quantity' => 10,
                    'unit_price' => 100.00,
                    'discount_percent' => 5,
                    'line_total' => 950.00,
                ]);

                QuotationDetail::create([
                    'quotation_id' => $quotation->quotation_id,
                    'trans_type' => 1,
                    'stk_code' => $stocks[1]->stock_id,
                    'quantity' => 5,
                    'unit_price' => 200.00,
                    'discount_percent' => 0,
                    'line_total' => 1000.00,
                ]);

                // Update total
                $total = QuotationDetail::where('quotation_id', $quotation->quotation_id)->sum('line_total');
                $quotation->update(['total' => $total + $quotation->freight_cost]);
            }
            
            $this->command->info('Quotation seeded successfully: ' . $quotation->quotation_number);
        } catch (\Exception $e) {
            $this->command->error('Error seeding quotation: ' . $e->getMessage());
        }
    }
}
