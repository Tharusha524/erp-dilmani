<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostSalesOrderWithDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'header' => 'required|array',
            'header.order_no' => 'required|integer',
            'header.trans_type' => 'required|integer',
            'header.version' => 'nullable|integer',
            'header.type' => 'nullable|integer',
            'header.debtor_no' => 'required|integer',
            'header.branch_code' => 'required|integer',
            'header.reference' => 'required|string|max:100',
            'header.comments' => 'nullable|string',
            'header.customer_ref' => 'nullable|string',
            'header.ord_date' => 'nullable|date',
            'header.order_type' => 'required|integer',
            'header.ship_via' => 'required|integer',
            'header.delivery_address' => 'nullable|string',
            'header.contact_phone' => 'nullable|string|max:30',
            'header.contact_email' => 'nullable|email|max:100',
            'header.deliver_to' => 'nullable|string',
            'header.freight_cost' => 'nullable|numeric',
            'header.from_stk_loc' => 'nullable|string|max:5',
            'header.delivery_date' => 'nullable|date',
            'header.payment_terms' => 'nullable|integer',
            'header.total' => 'numeric',
            'header.prep_amount' => 'numeric',
            'header.alloc' => 'numeric',
            'lines' => 'required|array|min:1',
            'lines.*.stk_code' => 'required|string|exists:stock_master,stock_id',
            'lines.*.description' => 'nullable|string',
            'lines.*.qty_sent' => 'numeric|min:0',
            'lines.*.unit_price' => 'numeric|min:0',
            'lines.*.quantity' => 'numeric|min:0',
            'lines.*.invoiced' => 'numeric|min:0',
            'lines.*.discount_percent' => 'numeric|min:0|max:100',
            'lines.*.id' => 'nullable|integer',
            'delete_detail_ids' => 'nullable|array',
            'delete_detail_ids.*' => 'integer',
        ];
    }
}
