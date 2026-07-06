<?php

namespace App\Http\Controllers;

use App\Http\Requests\CompanySetupRequest;
use App\Repositories\All\CompanySetup\CompanySetupInterface;
use App\Support\CompanySetupSettings;
use Illuminate\Support\Facades\Storage;

class CompanySetupController extends Controller
{
    private CompanySetupInterface $companyRepo;

    public function __construct(CompanySetupInterface $companyRepo)
    {
        $this->companyRepo = $companyRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(
            $this->companyRepo->allWithRelations(),
            200
        );
    }

    /**
     * Boolean flags and related settings for use across the ERP (reports, references, modules).
     */
    public function settings()
    {
        return response()->json(CompanySetupSettings::toApiPayload());
    }

    /**
     * Stream the company logo from storage (works regardless of APP_URL / storage symlink).
     */
    public function logo()
    {
        $company = $this->companyRepo->allWithRelations()->first();

        if (!$company?->new_company_logo) {
            return response()->json(['message' => 'Logo not configured'], 404);
        }

        if (!Storage::disk('public')->exists($company->new_company_logo)) {
            return response()->json(['message' => 'Logo file not found on server'], 404);
        }

        $mime = Storage::disk('public')->mimeType($company->new_company_logo) ?? 'image/png';

        return response()->file(
            Storage::disk('public')->path($company->new_company_logo),
            [
                'Content-Type' => $mime,
                'Cache-Control' => 'public, max-age=3600',
            ]
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CompanySetupRequest $request)
    {
        $data = $request->validated();

        // Handle logo upload
        if ($request->hasFile('new_company_logo')) {
            $path = $request->file('new_company_logo')->store('company_logos', 'public');
            $data['new_company_logo'] = $path;
        }

        $company = $this->companyRepo->create($data);
        $company->load(['homeCurrency', 'fiscalYear', 'basePriceCalculation']);

        return response()->json($company->fresh(), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $company = $this->companyRepo->find($id);

        if (!$company) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json($company, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    // public function update(CompanySetupRequest $request, string $id)
    // {
    //     $data = $request->validated();

    //     // Handle logo upload
    //     if ($request->hasFile('new_company_logo')) {
    //         $path = $request->file('new_company_logo')->store('company_logos', 'public');
    //         $data['new_company_logo'] = $path;
    //     }

    //     $updated = $this->companyRepo->update($id, $data);

    //     if (!$updated) {
    //         return response()->json(['message' => 'Record not found'], 404);
    //     }

    //     return response()->json(['message' => 'Updated successfully'], 200);
    // }
public function update(CompanySetupRequest $request, string $id)
{
    // First: Find the existing company
    $company = $this->companyRepo->find($id);

    if (!$company) {
        return response()->json(['message' => 'Record not found'], 404);
    }

    $data = $request->validated();

    // Handle logo deletion
    if ($request->boolean('delete_company_logo')) {
        if ($company->new_company_logo && Storage::disk('public')->exists($company->new_company_logo)) {
            Storage::disk('public')->delete($company->new_company_logo);
        }
        $data['new_company_logo'] = null;
        $data['delete_company_logo'] = false; // optional: reset the flag
    }

    // Handle new logo upload (and delete old one if exists)
    if ($request->hasFile('new_company_logo')) {
        // Delete old logo if exists
        if ($company->new_company_logo && Storage::disk('public')->exists($company->new_company_logo)) {
            Storage::disk('public')->delete($company->new_company_logo);
        }

        $path = $request->file('new_company_logo')->store('company_logos', 'public');
        $data['new_company_logo'] = $path;
    }

    // Now update
    $updated = $this->companyRepo->update($id, $data);

    if (!$updated) {
        return response()->json(['message' => 'Update failed'], 500);
    }

    $fresh = $this->companyRepo->allWithRelations()->firstWhere('id', (int) $id);

    return response()->json($fresh, 200);
}
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->companyRepo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
