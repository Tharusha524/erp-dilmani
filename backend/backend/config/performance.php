<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Dashboard caching (seconds). Set 0 to disable.
    |--------------------------------------------------------------------------
    */
    'dashboard_cache_seconds' => (int) env('DASHBOARD_CACHE_SECONDS', 300),
    'dashboard_alerts_cache_seconds' => (int) env('DASHBOARD_ALERTS_CACHE_SECONDS', 120),

    /*
    |--------------------------------------------------------------------------
    | API list pagination defaults
    |--------------------------------------------------------------------------
    */
    'default_list_per_page' => (int) env('API_DEFAULT_PER_PAGE', 50),
    'max_list_per_page' => (int) env('API_MAX_PER_PAGE', 200),

];
