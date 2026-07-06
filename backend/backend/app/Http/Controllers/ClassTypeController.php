<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClassTypeRequest;
use App\Repositories\All\ClassType\ClassTypeInterface;

class ClassTypeController extends Controller
{
    protected ClassTypeInterface $classTypeRepository;

    public function __construct(ClassTypeInterface $classTypeRepository)
    {
        $this->classTypeRepository = $classTypeRepository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = $this->classTypeRepository->all();
        return response()->json($data);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ClassTypeRequest $request)
    {
        $data = $this->classTypeRepository->create($request->validated());
        return response()->json(['message' => 'Class type created successfully', 'data' => $data]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $data = $this->classTypeRepository->find($id);
        return response()->json($data);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ClassTypeRequest $request, string $id)
    {
        $data = $this->classTypeRepository->update($id, $request->validated());
        return response()->json(['message' => 'Class type updated successfully', 'data' => $data]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->classTypeRepository->delete($id);
        return response()->json(['message' => 'Class type deleted successfully']);
    }
}
