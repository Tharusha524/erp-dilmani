<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SuppInvoiceItemsRequest extends FormRequest
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
            'supp_trans_no'      => 'nullable|integer|exists:supp_trans,trans_no',
            'supp_trans_type'    => 'nullable|integer|exists:supp_trans,trans_type',
            'gl_code'            => 'required|string|max:15',
            'grn_item_id'        => 'nullable|exists:grn_items,id',
            'po_detail_item_id'  => 'nullable|exists:purch_order_details,po_detail_item',
            'stock_id'           => 'required|string|exists:stock_master,stock_id',
            'description'        => 'nullable|string',
            'quantity'           => 'required|numeric',
            'unit_price'         => 'required|numeric',
            'unit_tax'           => 'required|numeric',
            'memo'               => 'nullable|string',
            'dimension_id'       => 'nullable|integer',
            'dimension2_id'      => 'nullable|integer',
        ];
    }
}
