<?php

// Bootstrap Laravel
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';

$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Quotation;
use Illuminate\Support\Facades\DB;

try {
    $debtor = DB::table('debtors_master')->first();
    
    if (!$debtor) {
        echo "ERROR: No debtors found\n";
        exit(1);
    }
    
    echo "Found debtor: {$debtor->name} (ID: {$debtor->debtor_no})\n";
    
    // Create quotation
    $q = Quotation::create([
        'quotation_number' => 'QT-' . date('Ymd') . '-001',
        'trans_type' => 1,
        'debtor_no' => $debtor->debtor_no,
        'reference' => 'REF-001',
        'customer_ref' => 'CUST-REF-001',
        'comments' => 'Test quotation',
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
    
    echo "SUCCESS: Created quotation ID {$q->quotation_id}, Number: {$q->quotation_number}\n";
    echo "Total: {$q->total}, Status: {$q->status}\n";
    
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

