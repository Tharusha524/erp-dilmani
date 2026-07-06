<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GrnBatchRequest extends FormRequest
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
            'supplier_id' => 'required|integer|exists:suppliers,supplier_id',
            'purch_order_no' => 'nullable|integer|exists:purch_orders,order_no',
            'reference' => 'required|string|max:60',
            'delivery_date' => 'required|date',
            'loc_code' => 'nullable|string|exists:inventory_locations,loc_code',
            'rate' => 'nullable|numeric'
        ];
    }
}
