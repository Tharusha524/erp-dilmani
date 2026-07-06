<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AiAgentService
{
    public function isConfigured(): bool
    {
        if (!config('ai.enabled', true)) {
            return false;
        }

        $key = config('ai.api_key');

        return is_string($key) && trim($key) !== '';
    }

    public function status(): array
    {
        return [
            'enabled' => $this->isConfigured(),
            'model' => config('ai.model'),
            'provider' => $this->detectProviderLabel(),
        ];
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     * @param  array<string, mixed>  $context
     * @return array{reply: string, model: string}
     */
    public function chat(array $messages, array $context = []): array
    {
        if (!$this->isConfigured()) {
            throw new RuntimeException(
                'AI agent is not configured. Set AI_API_KEY in the backend .env file and restart the server.'
            );
        }

        $systemPrompt = $this->buildSystemPrompt($context, $messages);
        $chatMessages = $this->normalizeMessages($messages);

        if ($chatMessages === []) {
            throw new RuntimeException('Please enter a message before sending.');
        }

        $models = $this->modelsToTry();
        $lastError = null;

        foreach ($models as $model) {
            try {
                if ($this->isGeminiProvider()) {
                    $result = $this->chatViaGeminiNative($model, $systemPrompt, $chatMessages);
                } else {
                    $result = $this->chatViaOpenAiCompatible($model, $systemPrompt, $chatMessages);
                }

                if ($result['reply'] !== '') {
                    return $result;
                }
            } catch (RuntimeException $e) {
                $lastError = $e;
                if ($this->isRateLimitError($e->getMessage()) && $model !== end($models)) {
                    continue;
                }
                throw $e;
            }
        }

        throw $lastError ?? new RuntimeException('AI agent could not generate a response.');
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $chatMessages
     * @return array{reply: string, model: string}
     */
    private function chatViaGeminiNative(string $model, string $systemPrompt, array $chatMessages): array
    {
        $contents = [];

        foreach ($chatMessages as $message) {
            $contents[] = [
                'role' => $message['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $message['content']]],
            ];
        }

        $payload = [
            'systemInstruction' => [
                'parts' => [['text' => $systemPrompt]],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'maxOutputTokens' => config('ai.max_tokens'),
                'temperature' => 0.4,
            ],
        ];

        $url = sprintf(
            'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent',
            $model
        );

        $response = $this->sendGeminiRequest($url, $payload);

        if (!$response->successful()) {
            throw new RuntimeException($this->formatProviderError($response));
        }

        $reply = trim((string) data_get(
            $response->json(),
            'candidates.0.content.parts.0.text',
            ''
        ));

        if ($reply === '') {
            $blockReason = data_get($response->json(), 'candidates.0.finishReason');
            throw new RuntimeException(
                'AI returned an empty response'
                . ($blockReason ? ' (reason: ' . $blockReason . ').' : '.')
            );
        }

        return ['reply' => $reply, 'model' => $model];
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $chatMessages
     * @return array{reply: string, model: string}
     */
    private function chatViaOpenAiCompatible(string $model, string $systemPrompt, array $chatMessages): array
    {
        $openAiMessages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $chatMessages
        );

        $response = Http::timeout(config('ai.timeout'))
            ->withToken((string) config('ai.api_key'))
            ->acceptJson()
            ->post(rtrim((string) config('ai.api_url'), '/') . '/chat/completions', [
                'model' => $model,
                'max_tokens' => config('ai.max_tokens'),
                'temperature' => 0.4,
                'messages' => $openAiMessages,
            ]);

        if (!$response->successful()) {
            throw new RuntimeException($this->formatProviderError($response));
        }

        $reply = trim((string) data_get($response->json(), 'choices.0.message.content', ''));

        if ($reply === '') {
            throw new RuntimeException('AI returned an empty response.');
        }

        return ['reply' => $reply, 'model' => $model];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function sendGeminiRequest(string $url, array $payload): Response
    {
        $key = trim((string) config('ai.api_key'));
        $client = Http::timeout(config('ai.timeout'))->acceptJson();

        // AI Studio keys (AIza...) use ?key= query param; OAuth tokens use Bearer.
        if (str_starts_with($key, 'AIza')) {
            return $client->post($url . '?key=' . urlencode($key), $payload);
        }

        return $client->withToken($key)->post($url, $payload);
    }

    private function isGeminiProvider(): bool
    {
        if (config('ai.provider') === 'gemini') {
            return true;
        }

        return str_contains((string) config('ai.api_url'), 'generativelanguage.googleapis.com');
    }

    /**
     * @return list<string>
     */
    private function modelsToTry(): array
    {
        $primary = trim((string) config('ai.model'));
        $fallbacks = config('ai.fallback_models', []);

        return array_values(array_unique(array_filter([$primary, ...$fallbacks])));
    }

    private function formatProviderError(?Response $response): string
    {
        if (!$response) {
            return 'AI provider did not respond. Check AI_API_URL and AI_API_KEY in .env.';
        }

        $status = $response->status();
        $message = $response->json('error.message')
            ?? data_get($response->json(), 'error.message')
            ?? $response->body();

        if (is_array($message)) {
            $message = json_encode($message);
        }

        $messageStr = is_string($message) ? $message : 'Unknown error';

        if ($status === 429 || str_contains($messageStr, 'quota')) {
            return 'Free AI quota exceeded. Wait 1 minute, try model gemini-2.5-flash-lite, '
                . 'or switch to Groq: AI_API_URL=https://api.groq.com/openai/v1, '
                . 'AI_MODEL=llama-3.3-70b-versatile (key from console.groq.com).';
        }

        if ($status === 401 || $status === 403) {
            return 'Invalid AI API key. Create a key at https://aistudio.google.com/apikey (AIzaSy...) '
                . 'or use Groq/Ollama. Restart php artisan serve after updating .env.';
        }

        if ($status === 400 && str_contains($messageStr, 'contents is not specified')) {
            return 'Gemini request format error (fixed in latest backend). '
                . 'Ensure AI_MODEL=gemini-2.5-flash and restart php artisan serve.';
        }

        return 'AI provider error (' . $status . '): ' . mb_substr($messageStr, 0, 400);
    }

    private function isRateLimitError(string $message): bool
    {
        return str_contains($message, 'quota') || str_contains($message, '(429)');
    }

    private function detectProviderLabel(): string
    {
        if ($this->isGeminiProvider()) {
            return 'gemini-native';
        }

        $url = (string) config('ai.api_url');

        if (str_contains($url, 'groq.com')) {
            return 'groq';
        }
        if (str_contains($url, '11434')) {
            return 'ollama';
        }

        return 'openai-compatible';
    }

    /**
     * @param  array<int, array{role?: string, content?: string}>  $messages
     * @return array<int, array{role: string, content: string}>
     */
    private function normalizeMessages(array $messages): array
    {
        $normalized = [];

        foreach ($messages as $message) {
            $role = $message['role'] ?? null;
            $content = isset($message['content']) ? trim((string) $message['content']) : '';

            if (!in_array($role, ['user', 'assistant'], true) || $content === '') {
                continue;
            }

            $normalized[] = ['role' => $role, 'content' => $content];
        }

        return array_slice($normalized, -20);
    }

    /**
     * @param  array<string, mixed>  $context
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    private function buildSystemPrompt(array $context, array $messages): string
    {
        $pathname = (string) ($context['pathname'] ?? '/');
        $pageTitle = (string) ($context['page_title'] ?? 'Unknown page');
        $module = (string) ($context['module'] ?? 'General');
        $userRole = (string) ($context['user_role'] ?? 'User');
        $language = (string) ($context['language'] ?? 'auto');
        $replyLanguage = $this->resolveReplyLanguage($language, $messages);
        $languageRule = match ($replyLanguage) {
            'si' => 'Always reply in Sinhala (සිංහල). Use clear, simple business Sinhala that staff can understand.',
            default => 'Always reply in English.',
        };

        return <<<PROMPT
You are the GrowLedger ERP AI Agent — a friendly business consultant and software guide embedded in an accounting and inventory ERP.

Your job:
1. Help business owners and staff use the ERP correctly (step-by-step when needed).
2. Advise on business operations: sales, purchasing, inventory, manufacturing, fixed assets, banking/GL, and company setup.
3. Answer "what should I do now?" based on the user's current screen and business situation.
4. Suggest practical business ideas for growth, cash flow, and process improvement.

ERP modules (sidebar):
- Sales: quotations, orders, deliveries, invoices, customer payments, credit notes, allocations
- Purchase: POs, GRN/receipts, supplier invoices, payments, credit notes
- Items & Inventory: items, locations, transfers, adjustments, pricing, standard costs
- Manufacturing (optional): BOM, work orders, issue, produce, cost
- Fixed Assets (optional): purchase, depreciation, transfer, disposal, sale
- Dimension (optional): project/cost center tagging
- Banking & GL: payments, deposits, transfers, journals, reconcile, accruals, trial balance, P&L, balance sheet
- Setup: company, users, access, taxes, fiscal year, GL defaults, diagnostics, backup

Standard flows:
- Sales: Quotation → Sales Order → Delivery → Invoice → Customer Payment → Allocation
- Purchase: PO → GRN → Supplier Invoice → Payment → Allocation
- New company: Company Setup → Users → Fiscal Year → Taxes → GL Setup → Chart/Bank → Items → Customers/Suppliers → System Diagnostics

Current user context:
- Role: {$userRole}
- Module: {$module}
- Page: {$pageTitle}
- URL path: {$pathname}

Rules:
- Be concise, actionable, and use bullet points for steps.
- Language: {$languageRule} You can mix ERP module names in English when helpful.
- If the user asks about a screen they are on, tailor advice to that module and page.
- If you lack data (exact stock, balances, customer names), say what to check in the ERP instead of inventing numbers.
- For setup issues, recommend System Diagnostics when appropriate.
- Do not claim you executed transactions — guide the user what to click and do.
- Keep answers under 350 words unless the user asks for detail.
PROMPT;
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    private function resolveReplyLanguage(string $language, array $messages): string
    {
        if ($language === 'si') {
            return 'si';
        }

        if ($language === 'en') {
            return 'en';
        }

        for ($i = count($messages) - 1; $i >= 0; $i--) {
            if (($messages[$i]['role'] ?? '') !== 'user') {
                continue;
            }

            $content = (string) ($messages[$i]['content'] ?? '');

            return $this->containsSinhala($content) ? 'si' : 'en';
        }

        return 'en';
    }

    private function containsSinhala(string $text): bool
    {
        return (bool) preg_match('/[\x{0D80}-\x{0DFF}]/u', $text);
    }
}
