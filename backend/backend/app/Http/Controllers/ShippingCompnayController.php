<?php

namespace App\Http\Controllers;

use App\Http\Requests\ShippingCompanyRequest;
use App\Repositories\All\ShippingCompany\ShippingCompanyInterface;

class ShippingCompnayController extends Controller
{
    private ShippingCompanyInterface $shippingCompanyRepo;

    public function __construct(ShippingCompanyInterface $shippingCompanyRepo)
    {
        $this->shippingCompanyRepo = $shippingCompanyRepo;
    }
    
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->shippingCompanyRepo->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ShippingCompanyRequest $request)
    {
        $shippingCompany = $this->shippingCompanyRepo->create($request->validated());
        return response()->json($shippingCompany, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $shippingCompany = $this->shippingCompanyRepo->find($id);
        return response()->json($shippingCompany);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ShippingCompanyRequest $request, string $id)
    {
        $this->shippingCompanyRepo->update($id, $request->validated());
        return response()->json(['message' => 'Shipping company updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->shippingCompanyRepo->delete($id);
        return response()->json(['message' => 'Shipping company deleted successfully']);
    }
}
