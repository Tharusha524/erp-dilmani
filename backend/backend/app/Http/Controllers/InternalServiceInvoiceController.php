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
