<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\CompanySetup;
use Illuminate\Support\Facades\Storage;

$c = CompanySetup::query()->first();
if (! $c) {
    echo "no company\n";
    exit;
}

echo 'name='.$c->name."\n";
echo 'new_company_logo='.($c->new_company_logo ?? 'null')."\n";
echo 'company_logo_url='.($c->company_logo_url ?? 'null')."\n";
echo 'app_url='.config('app.url')."\n";

if ($c->new_company_logo) {
    echo 'storage_exists='.(Storage::disk('public')->exists($c->new_company_logo) ? 'yes' : 'no')."\n";
    echo 'public_path='.public_path('storage/'.$c->new_company_logo)."\n";
    echo 'file_exists='.(file_exists(public_path('storage/'.$c->new_company_logo)) ? 'yes' : 'no')."\n";
}
