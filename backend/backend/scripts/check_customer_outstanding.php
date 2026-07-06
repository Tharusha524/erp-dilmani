<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\Accounting\AllocationService;
use App\Services\Sales\CustomerCreditService;
use Illuminate\Support\Facades\DB;

$mode = $argv[1] ?? 'Sun';
$paymentNo = isset($argv[2]) ? (int) $argv[2] : null;

if ($mode === 'payment' && $paymentNo) {
    $alloc = app(AllocationService::class);
    $open = $alloc->customerOpenItems($paymentNo, 12);
    echo "Payment #{$paymentNo} left: {$open['from']['left_to_allocate']}\n";
    echo "Targets: " . count($open['targets']) . "\n";
    foreach ($open['targets'] as $t) {
        $type = $t['type_name'] ?? $t['transaction_type'] ?? 'Unknown';
        echo "  {$type} #{$t['trans_no']} ref={$t['reference']} left={$t['left_to_allocate']}\n";
    }
    exit(0);
}

if ($mode === 'prepaid' && isset($argv[2])) {
    $debtorNo = (int) $argv[2];
    $orders = DB::table('sales_orders')
        ->where('debtor_no', $debtorNo)
        ->where('prep_amount', '>', 0)
        ->get();
    $alloc = app(AllocationService::class);
    foreach ($orders as $o) {
        $left = (float) $o->prep_amount - (float) ($o->alloc ?? 0);
        $ref = new ReflectionClass($alloc);
        $m = $ref->getMethod('prepaidOrderHasOpenInvoice');
        $m->setAccessible(true);
        $hasInv = $m->invoke($alloc, $debtorNo, (int) $o->order_no);
        echo "SO #{$o->order_no} trans_type={$o->trans_type} left={$left} open_invoice=" . ($hasInv ? 'yes' : 'no') . "\n";
    }
    exit(0);
}

$search = $mode;
$customers = DB::table('debtors_master')
    ->where('name', 'like', "%{$search}%")
    ->get(['debtor_no', 'name', 'credit_limit']);

if ($customers->isEmpty()) {
    echo "No customers matching: {$search}\n";
    exit(1);
}

$credit = app(CustomerCreditService::class);
$typeNames = [
    2 => 'Bank Deposit',
    10 => 'Sales Invoice',
    11 => 'Credit Note',
    12 => 'Customer Payment',
    13 => 'Delivery',
    30 => 'Sales Order (prepaid)',
];

foreach ($customers as $customer) {
    $debtorNo = (int) $customer->debtor_no;
    $outstanding = $credit->outstandingBalance($debtorNo);

    echo "\n=== {$customer->name} (#{$debtorNo}) ===\n";
    echo "Credit limit: " . number_format((float) $customer->credit_limit, 2) . "\n";
    echo "Outstanding:  " . number_format($outstanding, 2) . "\n\n";

    $rows = DB::table('debtor_trans')
        ->where('debtor_no', $debtorNo)
        ->whereNotIn('trans_type', [13])
        ->orderBy('tran_date')
        ->orderBy('trans_no')
        ->get();

    $running = 0.0;
    printf("%-6s %-8s %-14s %-12s %10s %10s %10s %10s\n",
        'Type', 'Trans#', 'Reference', 'Date', 'Total', 'Alloc', 'Signed', 'Running');
    echo str_repeat('-', 90) . "\n";

    foreach ($rows as $t) {
        $total = (float) $t->ov_amount + (float) $t->ov_gst + (float) $t->ov_freight
            + (float) $t->ov_freight_tax + (float) $t->ov_discount;
        $alloc = (float) ($t->alloc ?? 0);
        $net = $total - $alloc;
        $sign = in_array((int) $t->trans_type, [2, 11, 12], true) ? -1 : 1;
        $signed = $sign * $net;
        $running += $signed;

        $typeLabel = $typeNames[(int) $t->trans_type] ?? "Type {$t->trans_type}";
        printf("%-6s %-8s %-14s %-12s %10.2f %10.2f %10.2f %10.2f\n",
            $typeLabel,
            $t->trans_no,
            substr((string) ($t->reference ?? ''), 0, 14),
            substr((string) ($t->tran_date ?? ''), 0, 10),
            $total,
            $alloc,
            $signed,
            $running
        );
    }

    // Prepaid sales orders (alloc on sales_orders table)
    $orders = DB::table('sales_orders')
        ->where('debtor_no', $debtorNo)
        ->where('prep_amount', '>', 0)
        ->get();

    if ($orders->isNotEmpty()) {
        echo "\nPrepaid sales orders (not in debtor_trans balance):\n";
        foreach ($orders as $so) {
            printf("  SO #%s prep=%.2f alloc=%.2f left=%.2f ref=%s\n",
                $so->order_no,
                (float) $so->prep_amount,
                (float) ($so->alloc ?? 0),
                (float) $so->prep_amount - (float) ($so->alloc ?? 0),
                $so->reference ?? ''
            );
        }
    }

    // Cust allocations summary
    $allocs = DB::table('cust_allocations')
        ->where('person_id', $debtorNo)
        ->orderBy('date_alloc')
        ->get();

    if ($allocs->isNotEmpty()) {
        echo "\nCust allocations:\n";
        foreach ($allocs as $a) {
            printf("  %.2f from type %d #%d -> type %d #%d on %s\n",
                (float) $a->amt,
                $a->trans_type_from,
                $a->trans_no_from,
                $a->trans_type_to,
                $a->trans_no_to,
                $a->date_alloc
            );
        }
    }

    $bigPayments = DB::table('debtor_trans')
        ->where('debtor_no', $debtorNo)
        ->where('trans_type', 12)
        ->get()
        ->filter(function ($t) {
            $left = abs((float) $t->ov_amount) - (float) ($t->alloc ?? 0);
            return $left > 0.01;
        });

    if ($bigPayments->isNotEmpty()) {
        echo "\nPayments with unallocated balance:\n";
        foreach ($bigPayments as $p) {
            $left = abs((float) $p->ov_amount) - (float) ($p->alloc ?? 0);
            echo "  Payment #{$p->trans_no} ref={$p->reference} date={$p->tran_date} amount={$p->ov_amount} alloc={$p->alloc} unallocated={$left}\n";
        }
    }
}
