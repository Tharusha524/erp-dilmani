<?php

namespace App\Http\Controllers;

use App\Http\Requests\InternalServiceInvoiceRequest;
use App\Models\InternalServiceInvoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Standalone Internal Service Invoice — deliberately does not touch
 * debtor_trans/stock_moves/gl_trans. It only reads from existing tables
 * (customers, items, branches, etc.) for its dropdowns; everything it saves
 * lives in internal_service_invoices / internal_service_invoice_lines, so
 * this page has zero effect on customer balances, stock, or GL/reports.
 */
class InternalServiceInvoiceController extends Controller
{
    public function index(): JsonResponse
    {
        $invoices = InternalServiceInvoice::with('lines')
            ->orderByDesc('id')
            ->get();

        return response()->json($invoices);
    }

    public function store(InternalServiceInvoiceRequest $request): JsonResponse
    {
        $data = $request->validated();
        $lines = $data['lines'];
        unset($data['lines']);

        $invoice = DB::transaction(function () use ($data, $lines) {
            $data['created_by'] = $request->user()->id ?? null;

            $documentTotal = array_reduce($lines, function (float $sum, array $line) {
                $qty = (float) ($line['quantity'] ?? 0);
                $unitPrice = (float) ($line['unit_price'] ?? 0);
                $discount = (float) ($line['discount_percent'] ?? 0);
                return $sum + ($qty * $unitPrice * (1 - $discount / 100));
            }, 0.0) + (float) ($data['freight_cost'] ?? 0);

            $advanceAmount = round((float) ($data['advance_amount'] ?? 0), 2);
            $data['advance_amount'] = $advanceAmount;
            $data['balance_due'] = round(max(0, $documentTotal - $advanceAmount), 2);

            $invoice = InternalServiceInvoice::create($data);
            $invoice->lines()->createMany($lines);

            return $invoice;
        });

        return response()->json($invoice->load('lines'), 201);
    }

    public function show(int $id): JsonResponse
    {
        $invoice = InternalServiceInvoice::with('lines')->find($id);

        if (! $invoice) {
            return response()->json(['message' => 'Internal service invoice not found'], 404);
        }

        return response()->json($invoice);
    }
}
