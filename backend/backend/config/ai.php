<?php

return [
    'enabled' => env('AI_ENABLED', true),

    'api_key' => env('AI_API_KEY'),

    'api_url' => rtrim(env('AI_API_URL', 'https://api.openai.com/v1'), '/'),

    /** gemini | openai | groq | ollama — auto-detected from api_url if empty */
    'provider' => env('AI_PROVIDER', ''),

    'model' => env('AI_MODEL', 'gpt-4o-mini'),

    /** Comma-separated models to try if the primary hits rate limits (429). */
    'fallback_models' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('AI_FALLBACK_MODELS', ''))
    ))),

    'max_tokens' => (int) env('AI_MAX_TOKENS', 1200),

    'timeout' => (int) env('AI_TIMEOUT', 60),

    /** Whisper model for Sinhala/English voice input (Groq: whisper-large-v3) */
    'whisper_model' => env('AI_WHISPER_MODEL', 'whisper-large-v3'),
];
