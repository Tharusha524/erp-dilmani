<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('fiscal-year:rollover')->dailyAt('00:15');

// 24/7 Business Monitoring — texts the owner once a day if any product is
// out of stock or below its reorder level, so they don't have to log in
// and check the Stock/Low Stock pages themselves.
Schedule::command('supermarket:low-stock-alert')->dailyAt('08:00');
