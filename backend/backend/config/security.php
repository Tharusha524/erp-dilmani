<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Login brute-force protection
    |--------------------------------------------------------------------------
    */
    'login' => [
        // Max POST /login requests per minute (per IP + email).
        'rate_limit_per_minute' => (int) env('LOGIN_RATE_LIMIT', 5),

        // Failed attempts before temporary lockout.
        'max_attempts' => (int) env('LOGIN_MAX_ATTEMPTS', 5),

        // Lockout duration after max_attempts is reached.
        'lockout_minutes' => (int) env('LOGIN_LOCKOUT_MINUTES', 15),
    ],

    /*
    |--------------------------------------------------------------------------
    | API authentication tokens (Sanctum)
    |--------------------------------------------------------------------------
    */
    'auth' => [
        // Minutes until issued API tokens expire (null = never).
        'token_expiration_minutes' => ($raw = env('SANCTUM_TOKEN_EXPIRATION', '480')) === '' || $raw === '0'
            ? null
            : (int) $raw,

        // Keep only the newest N tokens per user (0 = unlimited).
        'max_tokens_per_user' => (int) env('AUTH_MAX_TOKENS_PER_USER', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Password policy (new / updated users)
    |--------------------------------------------------------------------------
    */
    'password' => [
        'min_length' => (int) env('PASSWORD_MIN_LENGTH', 8),
        'require_letter' => filter_var(env('PASSWORD_REQUIRE_LETTER', true), FILTER_VALIDATE_BOOLEAN),
        'require_number' => filter_var(env('PASSWORD_REQUIRE_NUMBER', true), FILTER_VALIDATE_BOOLEAN),
    ],

];
