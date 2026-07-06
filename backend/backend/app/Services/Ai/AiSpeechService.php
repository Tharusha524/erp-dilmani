<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AiSpeechService
{
    public function isConfigured(): bool
    {
        if (! config('ai.enabled', true)) {
            return false;
        }

        $key = config('ai.api_key');

        return is_string($key) && trim($key) !== '';
    }

    public function whisperModel(): string
    {
        return (string) config('ai.whisper_model', 'whisper-large-v3');
    }

    /**
     * @return array{text: string, model: string, language: string}
     */
    public function transcribe(UploadedFile $audio, string $language = 'si'): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('AI speech is not configured. Set AI_API_KEY in backend .env.');
        }

        $language = $this->normalizeLanguage($language);
        $apiUrl = $this->transcriptionUrl();
        $apiKey = (string) config('ai.api_key');
        $model = $this->whisperModel();

        /** @var Response $response */
        $response = Http::withToken($apiKey)
            ->timeout(max(30, (int) config('ai.timeout', 60)))
            ->attach(
                'file',
                file_get_contents($audio->getRealPath()),
                $audio->getClientOriginalName() ?: 'recording.webm',
                ['Content-Type' => $audio->getMimeType() ?: 'audio/webm']
            )
            ->post($apiUrl, [
                'model' => $model,
                'language' => $language,
                'response_format' => 'json',
                'temperature' => 0,
            ]);

        if (! $response->successful()) {
            $message = $response->json('error.message')
                ?? $response->json('message')
                ?? $response->body()
                ?? 'Speech transcription failed.';

            throw new RuntimeException(is_string($message) ? $message : 'Speech transcription failed.');
        }

        $text = trim((string) ($response->json('text') ?? ''));

        if ($text === '') {
            throw new RuntimeException(
                $language === 'si'
                    ? 'හඬ අහන්න බැරි වුණා. නැවත සිංහලෙන් කLEARLY කතා කර try කරන්න.'
                    : 'No speech detected. Please speak clearly and try again.'
            );
        }

        return [
            'text' => $text,
            'model' => $model,
            'language' => $language,
        ];
    }

    private function transcriptionUrl(): string
    {
        $base = rtrim((string) config('ai.api_url', 'https://api.groq.com/openai/v1'), '/');

        if (str_contains($base, 'generativelanguage.googleapis.com')) {
            throw new RuntimeException(
                'Cloud Sinhala speech needs Groq or OpenAI-compatible Whisper API. Set AI_API_URL=https://api.groq.com/openai/v1'
            );
        }

        return $base.'/audio/transcriptions';
    }

    private function normalizeLanguage(string $language): string
    {
        $language = strtolower(trim($language));

        if (in_array($language, ['si', 'sin', 'sinhala', 'sinhalese'], true)) {
            return 'si';
        }

        if (in_array($language, ['en', 'english'], true)) {
            return 'en';
        }

        return 'si';
    }
}
