<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostAiAgentChatRequest;
use App\Services\Ai\AiAgentService;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class AiAgentController extends Controller
{
    public function __construct(
        private AiAgentService $service,
        private \App\Services\Ai\AiSpeechService $speech,
    ) {
    }

    public function status(): JsonResponse
    {
        $status = $this->service->status();
        $status['speech_to_text'] = $this->speech->isConfigured();
        $status['whisper_model'] = $this->speech->whisperModel();

        return response()->json($status);
    }

    public function transcribe(\Illuminate\Http\Request $request): JsonResponse
    {
        $validated = $request->validate([
            'audio' => 'required|file|max:25600',
            'language' => 'nullable|string|in:si,en,auto',
        ]);

        try {
            $lang = $validated['language'] ?? 'si';
            if ($lang === 'auto') {
                $lang = 'si';
            }

            return response()->json(
                $this->speech->transcribe($validated['audio'], $lang)
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Speech transcription failed.'], 500);
        }
    }

    public function chat(PostAiAgentChatRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $user = $request->user();
            $context = $validated['context'] ?? [];

            if ($user && empty($context['user_role'])) {
                $context['user_role'] = (string) ($user->role ?? 'User');
            }

            $result = $this->service->chat($validated['messages'], $context);

            return response()->json($result);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'AI agent request failed. Please try again.'], 500);
        }
    }
}
