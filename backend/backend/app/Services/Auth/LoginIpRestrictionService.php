<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\IpUtils;

class LoginIpRestrictionService
{
    public const PREF_NAMES = [
        'loginIpRestrictionEnabled',
        'loginIpAllowLocalhost',
        'loginAllowedIps',
    ];

    /** @var array<string, array<string, mixed>> */
    private const DEFINITIONS = [
        'loginIpRestrictionEnabled' => ['category' => 'setup.security', 'type' => 'boolean', 'length' => null, 'value' => 'false'],
        'loginIpAllowLocalhost' => ['category' => 'setup.security', 'type' => 'boolean', 'length' => null, 'value' => 'true'],
        'loginAllowedIps' => ['category' => 'setup.security', 'type' => 'text', 'length' => null, 'value' => ''],
    ];

    public function ensureSeeded(): void
    {
        if (! Schema::hasTable('sys_prefs')) {
            return;
        }

        $now = now();
        foreach (self::DEFINITIONS as $name => $meta) {
            if (DB::table('sys_prefs')->where('name', $name)->exists()) {
                continue;
            }

            DB::table('sys_prefs')->insert([
                'name' => $name,
                'category' => $meta['category'],
                'type' => $meta['type'],
                'length' => $meta['length'],
                'value' => $meta['value'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function isEnabled(): bool
    {
        $this->ensureSeeded();

        return filter_var($this->getRaw('loginIpRestrictionEnabled', false), FILTER_VALIDATE_BOOLEAN);
    }

    public function allowLocalhost(): bool
    {
        $this->ensureSeeded();

        return filter_var($this->getRaw('loginIpAllowLocalhost', true), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * @return list<string>
     */
    public function getAllowedIps(): array
    {
        $this->ensureSeeded();
        $raw = trim((string) $this->getRaw('loginAllowedIps', ''));

        if ($raw === '') {
            return [];
        }

        $parts = preg_split('/[\r\n,;]+/', $raw) ?: [];
        $ips = [];

        foreach ($parts as $part) {
            $ip = trim($part);
            if ($ip !== '') {
                $ips[] = $ip;
            }
        }

        return array_values(array_unique($ips));
    }

    public function isIpAllowed(?string $ip): bool
    {
        if (! $this->isEnabled()) {
            return true;
        }

        if ($ip === null || $ip === '') {
            return false;
        }

        if ($this->allowLocalhost() && $this->isLocalhost($ip)) {
            return true;
        }

        foreach ($this->getAllowedIps() as $allowed) {
            if ($this->matches($ip, $allowed)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<string, mixed>
     */
    public function getSettings(): array
    {
        $this->ensureSeeded();

        return [
            'loginIpRestrictionEnabled' => $this->isEnabled(),
            'loginIpAllowLocalhost' => $this->allowLocalhost(),
            'loginAllowedIps' => implode("\n", $this->getAllowedIps()),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function update(array $data): array
    {
        $this->ensureSeeded();
        $now = now();

        $map = [
            'loginIpRestrictionEnabled' => isset($data['loginIpRestrictionEnabled'])
                ? ($data['loginIpRestrictionEnabled'] ? 'true' : 'false')
                : null,
            'loginIpAllowLocalhost' => isset($data['loginIpAllowLocalhost'])
                ? ($data['loginIpAllowLocalhost'] ? 'true' : 'false')
                : null,
            'loginAllowedIps' => array_key_exists('loginAllowedIps', $data)
                ? trim((string) $data['loginAllowedIps'])
                : null,
        ];

        foreach ($map as $name => $value) {
            if ($value === null) {
                continue;
            }

            DB::table('sys_prefs')->updateOrInsert(
                ['name' => $name],
                [
                    'category' => self::DEFINITIONS[$name]['category'],
                    'type' => self::DEFINITIONS[$name]['type'],
                    'length' => self::DEFINITIONS[$name]['length'],
                    'value' => $value,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }

        return $this->getSettings();
    }

    private function getRaw(string $name, mixed $default = ''): mixed
    {
        if (! Schema::hasTable('sys_prefs')) {
            return $default;
        }

        $row = DB::table('sys_prefs')->where('name', $name)->first();

        return $row->value ?? $default;
    }

    private function isLocalhost(string $ip): bool
    {
        return in_array($ip, ['127.0.0.1', '::1'], true);
    }

    private function matches(string $ip, string $allowed): bool
    {
        if ($ip === $allowed) {
            return true;
        }

        if (str_contains($allowed, '/')) {
            return IpUtils::checkIp($ip, [$allowed]);
        }

        return false;
    }
}
