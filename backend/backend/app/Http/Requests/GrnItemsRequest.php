<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GrnItemsRequest extends FormRequest
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
            'grn_batch_id'   => 'nullable|exists:grn_batch,id',
            'po_detail_item' => 'required|exists:purch_order_details,po_detail_item',
            'item_code'      => 'required|exists:stock_master,stock_id',
            'description'    => 'nullable|string',
            'qty_recd'       => 'required|numeric',
            'quantity_inv'   => 'required|numeric'
        ];
    }
}
