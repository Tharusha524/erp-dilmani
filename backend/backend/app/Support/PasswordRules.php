<?php

namespace App\Support;

use Illuminate\Validation\Rules\Password;

class PasswordRules
{
    public static function defaults(): Password
    {
        $rule = Password::min((int) config('security.password.min_length', 8));

        if (config('security.password.require_letter', true)) {
            $rule = $rule->letters();
        }

        if (config('security.password.require_number', true)) {
            $rule = $rule->numbers();
        }

        return $rule;
    }
}
