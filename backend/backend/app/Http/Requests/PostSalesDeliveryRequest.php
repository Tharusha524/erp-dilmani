<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostSalesDeliveryRequest extends FormRequest
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
            'order_no' => 'required|integer|exists:sales_orders,order_no',
            'tran_date' => 'required|date',
            'due_date' => 'nullable|date',
            'ship_via' => 'nullable|integer',
            'freight_cost' => 'nullable|numeric|min:0',
            'dimension_id' => 'nullable|integer',
            'dimension2_id' => 'nullable|integer',
            'comments' => 'nullable|string',
            'close_order' => 'nullable|boolean',
            'from_stk_loc' => 'nullable|string|max:5|exists:inventory_locations,loc_code',
            'reference' => 'nullable|string|max:60',
            'lines' => 'required|array|min:1',
            'lines.*.sales_order_detail_id' => 'required|integer|exists:sales_order_details,id',
            'lines.*.quantity' => 'required|numeric|min:0.0001',
        ];
    }
}
