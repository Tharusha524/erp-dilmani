<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DebtorTrans;
use App\Services\Accounting\PostingsService;
use App\Support\GlAccountResolver;
use App\Support\SalesLinePricing;
use Illuminate\Support\Facades\DB;

$repost = in_array('--repost', $argv ?? [], true);

$inv = DB::table('debtor_trans')->where('trans_type', 10)->orderByDesc('trans_no')->first();
if (!$inv) {
    echo "No sales invoice found.\n";
    exit(0);
}

if ($repost) {
    app(PostingsService::class)->repostDebtorTrans(
        DebtorTrans::where('trans_type', 10)->where('trans_no', $inv->trans_no)->first()
    );
    echo "Reposted invoice #{$inv->trans_no}\n";
}

$details = DB::table('debtor_trans_details')
    ->where('debtor_trans_type', 10)
    ->where('debtor_trans_no', $inv->trans_no)
    ->get();

echo "Invoice #{$inv->trans_no} ov_amount={$inv->ov_amount}\n";
foreach ($details as $d) {
    $gross = SalesLinePricing::lineGross($d);
    $disc = SalesLinePricing::lineDiscount($d);
    echo "  {$d->stock_id} qty={$d->quantity} price={$d->unit_price} disc%={$d->discount_percent} => gross={$gross} discount={$disc}\n";
}

$pref = DB::table('sys_prefs')->where('name', 'salesDiscountAccount')->value('value');
echo "salesDiscountAccount resolved: " . GlAccountResolver::resolve('salesDiscountAccount', $pref) . "\n";

$gl = DB::table('gl_trans')->where('type', 10)->where('type_no', $inv->trans_no)->get();
$debit = 0;
$credit = 0;
foreach ($gl as $g) {
    $name = DB::table('chart_master')->where('account_code', trim($g->account))->value('account_name');
    $amt = (float) $g->amount;
    if ($amt > 0) {
        $debit += $amt;
    } else {
        $credit += abs($amt);
    }
    echo trim($g->account) . " ({$name}) | {$amt} | {$g->memo}\n";
}
echo "Balanced: " . (abs($debit - $credit) < 0.02 ? 'yes' : "no (Dr {$debit} Cr {$credit})") . "\n";
