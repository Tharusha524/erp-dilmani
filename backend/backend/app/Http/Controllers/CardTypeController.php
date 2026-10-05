<?php

namespace App\Http\Controllers;

use App\Models\CardType;
use App\Models\PosPaymentCardType;
use Illuminate\Http\Request;

class CardTypeController extends Controller
{
    public function index()
    {
        return response()->json(CardType::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);
        return response()->json(CardType::create($data), 201);
    }

    public function update(Request $request, string $id)
    {
        $cardType = CardType::find($id);
        if (!$cardType) {
            return response()->json(['message' => 'Not Found'], 404);
        }
        $data = $request->validate(['name' => 'required|string|max:255']);
        $cardType->update($data);
        return response()->json($cardType);
    }

    public function destroy(string $id)
    {
        $cardType = CardType::find($id);
        if (!$cardType) {
            return response()->json(['message' => 'Not Found'], 404);
        }
        $cardType->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    /**
     * Record which card type a payment on an already-posted sale used —
     * called from POS Checkout right after a successful sale, purely a
     * reporting tag. Never touches the invoice/payment itself.
     */
    public function tagPayment(Request $request)
    {
        $data = $request->validate([
            'debtor_trans_no' => 'required|integer',
            'debtor_trans_type' => 'required|integer',
            'bank_account_id' => 'nullable|integer',
            'card_type_id' => 'required|integer|exists:card_types,id',
        ]);

        return response()->json(PosPaymentCardType::create($data), 201);
    }
}
