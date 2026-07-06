<?php

namespace App\Http\Controllers;

use App\Services\Mail\MailSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MailSettingsController extends Controller
{
    public function __construct(private MailSettingsService $mailSettings)
    {
    }

    public function show(): JsonResponse
    {
        return response()->json($this->mailSettings->getSettings());
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mailEnabled' => 'sometimes|boolean',
            'mailHost' => 'nullable|string|max:255',
            'mailPort' => 'nullable|integer|min:1|max:65535',
            'mailScheme' => 'nullable|string|in:tls,ssl,',
            'mailUsername' => 'nullable|string|max:255',
            'mailPassword' => 'nullable|string|max:500',
            'mailFromAddress' => 'nullable|email|max:255',
            'mailFromName' => 'nullable|string|max:255',
        ]);

        $settings = $this->mailSettings->update($validated);

        return response()->json([
            'message' => 'Email settings saved.',
            'settings' => $settings,
        ]);
    }

    public function sendTest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'to' => 'required|email|max:255',
        ]);

        if (! $this->mailSettings->isDeliverable()) {
            return response()->json([
                'message' => 'Email is not configured. Enable SMTP and fill in host, username, and password.',
            ], 422);
        }

        try {
            $this->mailSettings->sendMessage(
                $validated['to'],
                'ERP test email',
                "This is a test email from your ERP mail settings.\n\nIf you received this message, SMTP is configured correctly."
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Test email failed: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Test email sent to ' . $validated['to'],
            'to' => $validated['to'],
        ]);
    }
}
