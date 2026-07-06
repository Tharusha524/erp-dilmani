<?php

namespace App\Services\Mail;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class MailSettingsService
{
    public const PREF_NAMES = [
        'mailEnabled',
        'mailHost',
        'mailPort',
        'mailScheme',
        'mailUsername',
        'mailPassword',
        'mailFromAddress',
        'mailFromName',
    ];

    /** @var array<string, array<string, mixed>> */
    private const DEFINITIONS = [
        'mailEnabled' => ['category' => 'setup.mail', 'type' => 'boolean', 'length' => null, 'value' => 'false'],
        'mailHost' => ['category' => 'setup.mail', 'type' => 'string', 'length' => 255, 'value' => ''],
        'mailPort' => ['category' => 'setup.mail', 'type' => 'number', 'length' => 11, 'value' => '587'],
        'mailScheme' => ['category' => 'setup.mail', 'type' => 'string', 'length' => 10, 'value' => 'tls'],
        'mailUsername' => ['category' => 'setup.mail', 'type' => 'string', 'length' => 255, 'value' => ''],
        'mailPassword' => ['category' => 'setup.mail', 'type' => 'text', 'length' => null, 'value' => ''],
        'mailFromAddress' => ['category' => 'setup.mail', 'type' => 'string', 'length' => 255, 'value' => ''],
        'mailFromName' => ['category' => 'setup.mail', 'type' => 'string', 'length' => 255, 'value' => ''],
    ];

    public function ensureSeeded(): void
    {
        if (! Schema::hasTable('sys_prefs')) {
            return;
        }

        $now = now();
        foreach (self::DEFINITIONS as $name => $meta) {
            $exists = DB::table('sys_prefs')->where('name', $name)->exists();
            if ($exists) {
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

    /**
     * @return array<string, mixed>
     */
    public function getSettings(): array
    {
        $this->ensureSeeded();
        $raw = $this->getRawSettings();

        $fromAddress = trim((string) ($raw['mailFromAddress'] ?? ''));
        if ($fromAddress === '') {
            $fromAddress = $this->defaultFromAddress();
        }

        $fromName = trim((string) ($raw['mailFromName'] ?? ''));
        if ($fromName === '') {
            $fromName = (string) config('app.name', 'ERP');
        }

        return [
            'mailEnabled' => filter_var($raw['mailEnabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'mailHost' => (string) ($raw['mailHost'] ?? ''),
            'mailPort' => (int) ($raw['mailPort'] ?: 587),
            'mailScheme' => (string) ($raw['mailScheme'] ?? 'tls'),
            'mailUsername' => (string) ($raw['mailUsername'] ?? ''),
            'passwordConfigured' => $this->hasPassword($raw),
            'mailFromAddress' => $fromAddress,
            'mailFromName' => $fromName,
            'deliverable' => $this->isDeliverable($raw),
        ];
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(array $data): array
    {
        $this->ensureSeeded();
        $current = $this->getRawSettings();

        $enabled = array_key_exists('mailEnabled', $data)
            ? filter_var($data['mailEnabled'], FILTER_VALIDATE_BOOLEAN)
            : filter_var($current['mailEnabled'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $this->upsertPref('mailEnabled', $enabled ? 'true' : 'false');
        $this->upsertPref('mailHost', trim((string) ($data['mailHost'] ?? $current['mailHost'] ?? '')));
        $this->upsertPref('mailPort', (string) ((int) ($data['mailPort'] ?? $current['mailPort'] ?? 587)));
        $this->upsertPref('mailScheme', trim((string) ($data['mailScheme'] ?? $current['mailScheme'] ?? 'tls')));
        $this->upsertPref('mailUsername', trim((string) ($data['mailUsername'] ?? $current['mailUsername'] ?? '')));
        $this->upsertPref('mailFromAddress', trim((string) ($data['mailFromAddress'] ?? $current['mailFromAddress'] ?? '')));
        $this->upsertPref('mailFromName', trim((string) ($data['mailFromName'] ?? $current['mailFromName'] ?? '')));

        $password = (string) ($data['mailPassword'] ?? '');
        if ($password !== '') {
            $this->upsertPref('mailPassword', Crypt::encryptString($password));
        }

        return $this->getSettings();
    }

    public function isDeliverable(?array $raw = null): bool
    {
        $raw ??= $this->getRawSettings();

        if (! filter_var($raw['mailEnabled'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        if (trim((string) ($raw['mailHost'] ?? '')) === '') {
            return false;
        }

        if ((int) ($raw['mailPort'] ?? 0) <= 0) {
            return false;
        }

        if (trim((string) ($raw['mailUsername'] ?? '')) === '') {
            return false;
        }

        return $this->hasPassword($raw);
    }

    public function applyMailer(): string
    {
        if (! $this->isDeliverable()) {
            return (string) config('mail.default', 'log');
        }

        $raw = $this->getRawSettings();
        $fromAddress = trim((string) ($raw['mailFromAddress'] ?? ''));
        if ($fromAddress === '') {
            $fromAddress = trim((string) ($raw['mailUsername'] ?? ''));
        }
        $fromName = trim((string) ($raw['mailFromName'] ?? ''));
        if ($fromName === '') {
            $fromName = (string) config('app.name', 'ERP');
        }

        $scheme = trim((string) ($raw['mailScheme'] ?? ''));
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            'mail.mailers.smtp.host' => (string) $raw['mailHost'],
            'mail.mailers.smtp.port' => (int) $raw['mailPort'],
            'mail.mailers.smtp.scheme' => $scheme !== '' ? $scheme : null,
            'mail.mailers.smtp.username' => (string) $raw['mailUsername'],
            'mail.mailers.smtp.password' => $this->decryptPassword((string) ($raw['mailPassword'] ?? '')),
            'mail.from.address' => $fromAddress,
            'mail.from.name' => $fromName,
        ]);

        Mail::purge('smtp');

        return 'smtp';
    }

    /**
     * @param array{content: string, filename: string, mime?: string}|null $attachment
     */
    public function sendMessage(string $to, string $subject, string $body, ?array $attachment = null): void
    {
        $mailer = $this->applyMailer();

        Mail::mailer($mailer)->send([], [], function ($message) use ($to, $subject, $body, $attachment) {
            $message->to($to)
                ->subject($subject)
                ->html(nl2br(e($body)));

            if ($attachment !== null) {
                $message->attachData(
                    $attachment['content'],
                    $attachment['filename'],
                    ['mime' => $attachment['mime'] ?? 'application/pdf']
                );
            }
        });
    }

    /**
     * @return array<string, string>
     */
    private function getRawSettings(): array
    {
        if (! Schema::hasTable('sys_prefs')) {
            return [];
        }

        $rows = DB::table('sys_prefs')
            ->whereIn('name', self::PREF_NAMES)
            ->pluck('value', 'name');

        return $rows->map(fn ($value) => (string) $value)->all();
    }

    private function upsertPref(string $name, string $value): void
    {
        $meta = self::DEFINITIONS[$name];
        $now = now();

        $exists = DB::table('sys_prefs')->where('name', $name)->exists();
        if ($exists) {
            DB::table('sys_prefs')->where('name', $name)->update([
                'category' => $meta['category'],
                'type' => $meta['type'],
                'length' => $meta['length'],
                'value' => $value,
                'updated_at' => $now,
            ]);

            return;
        }

        DB::table('sys_prefs')->insert([
            'name' => $name,
            'category' => $meta['category'],
            'type' => $meta['type'],
            'length' => $meta['length'],
            'value' => $value,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * @param array<string, string> $raw
     */
    private function hasPassword(array $raw): bool
    {
        return $this->decryptPassword((string) ($raw['mailPassword'] ?? '')) !== '';
    }

    private function decryptPassword(string $stored): string
    {
        if ($stored === '') {
            return '';
        }

        try {
            return Crypt::decryptString($stored);
        } catch (\Throwable) {
            return '';
        }
    }

    private function defaultFromAddress(): string
    {
        if (! Schema::hasTable('company_setup')) {
            return '';
        }

        $email = DB::table('company_setup')->value('email_address');

        return is_string($email) ? trim($email) : '';
    }
}
