<?php

namespace App\Http\Controllers;

use App\Http\Requests\EntityAttachmentRequest;
use App\Models\EntityAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EntityAttachmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'entity_type' => 'required|string|max:50',
            'entity_id' => 'required|string|max:64',
            'include_inactive' => 'sometimes|boolean',
        ]);

        $query = EntityAttachment::query()
            ->where('entity_type', $request->input('entity_type'))
            ->where('entity_id', $request->input('entity_id'))
            ->orderByDesc('doc_date');

        if (!$request->boolean('include_inactive')) {
            $query->where('inactive', false);
        }

        return response()->json($query->get());
    }

    public function store(EntityAttachmentRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $path = $file->store('entity_attachments', 'public');

        $attachment = EntityAttachment::create([
            'entity_type' => $request->input('entity_type'),
            'entity_id' => $request->input('entity_id'),
            'doc_title' => $request->input('doc_title'),
            'doc_date' => $request->input('doc_date'),
            'stored_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'inactive' => $request->boolean('inactive'),
        ]);

        return response()->json($attachment, 201);
    }

    public function show(int $id): JsonResponse
    {
        $attachment = EntityAttachment::find($id);
        if (!$attachment) {
            return response()->json(['message' => 'Attachment not found'], 404);
        }

        return response()->json($attachment);
    }

    public function update(EntityAttachmentRequest $request, int $id): JsonResponse
    {
        $attachment = EntityAttachment::find($id);
        if (!$attachment) {
            return response()->json(['message' => 'Attachment not found'], 404);
        }

        $data = collect($request->validated())->except(['file'])->all();

        if ($request->hasFile('file')) {
            if (Storage::disk('public')->exists($attachment->stored_path)) {
                Storage::disk('public')->delete($attachment->stored_path);
            }
            $file = $request->file('file');
            $path = $file->store('entity_attachments', 'public');
            $data['stored_path'] = $path;
            $data['original_filename'] = $file->getClientOriginalName();
            $data['mime_type'] = $file->getClientMimeType();
            $data['size'] = $file->getSize();
            unset($data['file']);
        }

        $attachment->update($data);

        return response()->json($attachment->fresh());
    }

    public function destroy(int $id): JsonResponse
    {
        $attachment = EntityAttachment::find($id);
        if (!$attachment) {
            return response()->json(['message' => 'Attachment not found'], 404);
        }

        if (Storage::disk('public')->exists($attachment->stored_path)) {
            Storage::disk('public')->delete($attachment->stored_path);
        }

        $attachment->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    public function download(int $id): StreamedResponse|JsonResponse
    {
        $attachment = EntityAttachment::find($id);
        if (!$attachment) {
            return response()->json(['message' => 'Attachment not found'], 404);
        }

        if (!Storage::disk('public')->exists($attachment->stored_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('public')->download(
            $attachment->stored_path,
            $attachment->original_filename
        );
    }
}
