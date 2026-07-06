<?php

namespace App\Http\Controllers;

use App\Services\Mail\MailSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class TransactionDocumentEmailController extends Controller
{
    public function __construct(private MailSettingsService $mailSettings)
    {
    }

    /**
     * Send a transaction PDF as an email attachment (invoice, receipt, PO, etc.).
     */
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'to' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:8000',
            'pdf' => 'required|file|max:15360',
            'document_title' => 'nullable|string|max:255',
        ]);

        /** @var UploadedFile $file */
        $file = $request->file('pdf');
        $filename = $file->getClientOriginalName() ?: 'document.pdf';
        if (! str_ends_with(strtolower($filename), '.pdf')) {
            $filename .= '.pdf';
        }

        $mime = $file->getMimeType() ?: 'application/pdf';
        if ($mime !== 'application/pdf' && $mime !== 'application/octet-stream') {
            return response()->json([
                'message' => 'The uploaded file must be a PDF document.',
            ], 422);
        }

        $pdfContent = file_get_contents($file->getRealPath());
        if ($pdfContent === false || $pdfContent === '') {
            return response()->json([
                'message' => 'The PDF file could not be read.',
            ], 422);
        }

        if (! $this->mailSettings->isDeliverable()) {
            return response()->json([
                'message' => 'Email is not configured. Go to Setup → Company Setup → Email Setup and configure SMTP.',
                'setup_path' => '/setup/companysetup/email-setup',
            ], 422);
        }

        $to = $validated['to'];
        $subject = $validated['subject'];
        $body = $validated['body'];

        try {
            $this->mailSettings->sendMessage($to, $subject, $body, [
                'content' => $pdfContent,
                'filename' => $filename,
                'mime' => 'application/pdf',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to send email: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Email sent with PDF attached to ' . $to,
            'to' => $to,
            'delivered' => true,
        ]);
    }
}
