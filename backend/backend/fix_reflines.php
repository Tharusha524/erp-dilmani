<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$types = [0,1,2,4,10,11,12,13,16,17,18,20,21,22,25,26,28,29,30,32,35,40];
$count = 0;
foreach($types as $type) {
    if (!DB::table("reflines")->where("trans_type", $type)->exists()) {
        DB::table("reflines")->insert([
            "trans_type" => $type,
            "prefix" => "",
            "pattern" => "{001}/{YYYY}-{YYYY}",
            "memo" => "Auto-generated",
            "default" => 1,
            "inactive" => 0,
            "created_at" => now(),
            "updated_at" => now(),
        ]);
        $count++;
    }
}
echo "Inserted $count missing reflines.\n";
