<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExchangeRateRequest;
use App\Repositories\All\ExchangeRate\ExchangeRateInterface;

class ExchangeRateController extends Controller
{
    private ExchangeRateInterface $exchangeRateRepo;

    public function __construct(ExchangeRateInterface $exchangeRateRepo)
    {
        $this->exchangeRateRepo = $exchangeRateRepo;
    }

    public function index()
    {
        return response()->json($this->exchangeRateRepo->all(), 200);
    }

    public function store(ExchangeRateRequest $request)
    {
        $rate = $this->exchangeRateRepo->create($request->validated());
        return response()->json($rate, 201);
    }

    public function show(string $id)
    {
        $rate = $this->exchangeRateRepo->find($id);
        if (!$rate) {
            return response()->json(['message' => 'Not Found'], 404);
        }
        return response()->json($rate, 200);
    }

    public function update(ExchangeRateRequest $request, string $id)
    {
        $updated = $this->exchangeRateRepo->update($id, $request->validated());

        if (!$updated) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json(['message' => 'Updated successfully'], 200);
    }

    public function destroy(string $id)
    {
        $deleted = $this->exchangeRateRepo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
