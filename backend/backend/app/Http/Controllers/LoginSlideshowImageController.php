<?php

namespace App\Http\Controllers;

use App\Models\LoginSlideshowImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LoginSlideshowImageController extends Controller
{
    /** Public — the login/signup page fetches slides without being authenticated. */
    public function index()
    {
        return response()->json(
            LoginSlideshowImage::orderBy('sort_order')->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:5120',
        ]);

        $path = $request->file('image')->store('login_slideshow', 'public');

        $maxOrder = (int) (LoginSlideshowImage::max('sort_order') ?? 0);

        $image = LoginSlideshowImage::create([
            'path' => $path,
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json($image, 201);
    }

    public function destroy(int $id)
    {
        $image = LoginSlideshowImage::findOrFail($id);

        if (Storage::disk('public')->exists($image->path)) {
            Storage::disk('public')->delete($image->path);
        }

        $image->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    /** Body: { order: [id, id, id, ...] } in the desired display order. */
    public function reorder(Request $request)
    {
        $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer',
        ]);

        foreach ($request->input('order') as $index => $id) {
            LoginSlideshowImage::where('id', $id)->update(['sort_order' => $index]);
        }

        return response()->json(
            LoginSlideshowImage::orderBy('sort_order')->get()
        );
    }
}
