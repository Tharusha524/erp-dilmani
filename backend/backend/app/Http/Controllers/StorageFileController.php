<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Serves files from the "public" storage disk directly, without relying on
 * the public/storage symlink (php artisan storage:link). That symlink is
 * created locally but usually doesn't survive being uploaded to shared
 * hosting, so uploaded images (profile pictures, company logo, slideshow
 * images, etc.) 404 in production even though they work locally. Reading
 * the file through the filesystem here works identically everywhere.
 */
class StorageFileController extends Controller
{
    public function show(string $path): StreamedResponse|\Illuminate\Http\JsonResponse
    {
        $disk = Storage::disk('public');

        if (!$disk->exists($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return $disk->response($path);
    }
}
