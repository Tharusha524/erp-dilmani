<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostPurchOrderWithDetailsRequest extends FormRequest
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
            'header.supplier_id' => 'required|integer|exists:suppliers,supplier_id',
            'header.comments' => 'nullable|string',
            'header.ord_date' => 'required|date',
            'header.reference' => 'required|string|max:100',
            'header.requisition_no' => 'nullable|string',
            'header.into_stock_location' => 'required|string|exists:inventory_locations,loc_code',
            'header.delivery_address' => 'nullable|string',
            'header.total' => 'numeric',
            'header.prep_amount' => 'numeric',
            'header.alloc' => 'numeric',
            'header.tax_included' => 'boolean',
            'header.cost_center_id' => 'nullable|integer',
            'lines' => 'required|array|min:1',
            'lines.*.item_code' => 'required|string|exists:stock_master,stock_id',
            'lines.*.description' => 'nullable|string',
            'lines.*.delivery_date' => 'nullable|date',
            'lines.*.qty_invoiced' => 'numeric|min:0',
            'lines.*.unit_price' => 'numeric|min:0',
            'lines.*.act_price' => 'numeric|min:0',
            'lines.*.std_cost_unit' => 'numeric|min:0',
            'lines.*.quantity_ordered' => 'numeric|min:0',
            'lines.*.quantity_received' => 'numeric|min:0',
            'lines.*.po_detail_item' => 'nullable|integer',
            'lines.*.id' => 'nullable|integer',
            'delete_detail_ids' => 'nullable|array',
            'delete_detail_ids.*' => 'integer',
        ];
    }
}
