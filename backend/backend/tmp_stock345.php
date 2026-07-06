<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "stock_moves for 345:\n";
print_r(DB::table('stock_moves')->where('stock_id', '345')->get()->toArray());
echo "loc_stock for 345:\n";
print_r(DB::table('loc_stock')->where('stock_id', '345')->get()->toArray());
$item = DB::table('stock_master')->where('stock_id', '345')->first();
echo "stock_master 345: " . json_encode($item) . "\n";
