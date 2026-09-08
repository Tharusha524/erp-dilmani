<?php

namespace App\Http\Controllers;

use App\Models\DebtorTrans;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Read-only lookup of a posted sales invoice (header + lines) by trans_no,
 * used by the Supermarket "Process Return" screen to prefill what was
 * actually sold — nothing here writes to any accounting table.
 */
class InvoiceLookupController extends Controller
{
    private const TYPE_INVOICE = 10;

    public function show(int $transNo): JsonResponse
    {
        $header = DebtorTrans::query()
            ->where('trans_type', self::TYPE_INVOICE)
            ->where('trans_no', $transNo)
            ->first();

        if (! $header) {
            return response()->json(['message' => 'Invoice not found.'], 404);
        }

        $lines = DB::table('debtor_trans_details')
            ->join('stock_master', 'stock_master.stock_id', '=', 'debtor_trans_details.stock_id')
            ->where('debtor_trans_details.debtor_trans_type', self::TYPE_INVOICE)
            ->where('debtor_trans_details.debtor_trans_no', $transNo)
            ->select(
                'debtor_trans_details.stock_id',
                'stock_master.description',
                'debtor_trans_details.quantity',
                'debtor_trans_details.unit_price',
                'debtor_trans_details.discount_percent',
                'debtor_trans_details.qty_done'
            )
            ->get();

        $customer = DB::table('debtors_master')->where('debtor_no', $header->debtor_no)->first();
        $branch = DB::table('cust_branch')->where('branch_code', $header->branch_code)->first();

        return response()->json([
            'trans_no' => $header->trans_no,
            'reference' => $header->reference,
            'tran_date' => $header->tran_date,
            'debtor_no' => $header->debtor_no,
            'customer_name' => $customer->name ?? null,
            'branch_code' => $header->branch_code,
            'order_type' => $header->tpe,
            'ship_via' => $header->ship_via,
            'default_location' => $branch->default_location ?? null,
            'ov_amount' => $header->ov_amount,
            'ov_gst' => $header->ov_gst,
            'lines' => $lines,
        ]);
    }
}
