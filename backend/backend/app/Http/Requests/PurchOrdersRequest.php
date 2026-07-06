<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PurchOrdersRequest extends FormRequest
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
            'order_no' => 'required|integer',
            'supplier_id' => 'required|exists:suppliers,supplier_id',
            'comments' => 'nullable|string',
            'ord_date' => 'required|date',
            'reference' => 'required|string',
            'requisition_no' => 'nullable|string',
            'into_stock_location' => 'required|exists:inventory_locations,loc_code',
            'delivery_address' => 'required|string',
            'total' => 'numeric',
            'prep_amount' => 'numeric',
            'alloc' => 'numeric',
            'tax_included' => 'boolean'
        ];
    }
}
