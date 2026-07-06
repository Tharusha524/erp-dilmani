<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PurchOrderDetailsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'po_detail_item'    => 'required|integer',
            'order_no'          => 'required|exists:purch_orders,order_no',
            'item_code'         => 'required|exists:stock_master,stock_id',
            'description'       => 'nullable|string',
            'delivery_date'     => 'required|date',
            'qty_invoiced'      => 'numeric',
            'unit_price'        => 'numeric',
            'act_price'         => 'numeric',
            'std_cost_unit'     => 'numeric',
            'quantity_ordered' => 'numeric',
            'quantity_received'=> 'numeric',
        ];
    }
}
