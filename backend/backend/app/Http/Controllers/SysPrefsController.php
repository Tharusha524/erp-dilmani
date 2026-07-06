<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\SysPrefsRequest;
use App\Repositories\All\SysPrefs\SysPrefsInterface;

class SysPrefsController extends Controller
{
    private SysPrefsInterface $sysPrefs;
    public function __construct(SysPrefsInterface $sysPrefs)
    {
        $this->sysPrefs = $sysPrefs;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $this->sysPrefs->ensureSeeded();

        return response()->json($this->sysPrefs->all());
    }

    /**
     * Bulk upsert preference values by name (System & General GL Setup form).
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'prefs' => 'required|array',
            'prefs.*' => 'nullable|string',
        ]);

        $count = $this->sysPrefs->bulkUpsert($validated['prefs']);

        return response()->json([
            'message' => 'System preferences updated.',
            'updated' => $count,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SysPrefsRequest $request)
    {
        $data = $this->sysPrefs->create($request->validated());
        return response()->json($data, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->sysPrefs->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $this->sysPrefs->ensureSeeded();
        $updated = $this->sysPrefs->bulkUpsert([$id => (string) $request->input('value', '')]);
        if ($updated === 0) {
            return response()->json(['message' => 'Unknown preference name'], 404);
        }

        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->sysPrefs->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
