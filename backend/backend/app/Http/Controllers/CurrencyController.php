<?php

namespace App\Http\Controllers;

use App\Http\Requests\CurrencyRequest;
use App\Repositories\All\Currency\CurrencyInterface;

class CurrencyController extends Controller
{
    private CurrencyInterface $currencyRepo;

    public function __construct(CurrencyInterface $currencyRepo)
    {
        $this->currencyRepo = $currencyRepo;
    }

    public function index()
    {
        return response()->json($this->currencyRepo->all());
    }

    public function store(CurrencyRequest $request)
    {
        $currency = $this->currencyRepo->create($request->validated());
        return response()->json($currency, 201);
    }

    public function show(int $id)
    {
        $currency = $this->currencyRepo->find($id);
        if (!$currency) {
            return response()->json(['message' => 'Currency not found'], 404);
        }
        return response()->json($currency);
    }

    public function update(CurrencyRequest $request, int $id)
    {
        $updated = $this->currencyRepo->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Currency not found'], 404);
        }
        return response()->json($this->currencyRepo->find($id));
    }

    public function destroy(int $id)
    {
        $deleted = $this->currencyRepo->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Currency not found'], 404);
        }
        return response()->json(['message' => 'Currency deleted']);
    }
}
