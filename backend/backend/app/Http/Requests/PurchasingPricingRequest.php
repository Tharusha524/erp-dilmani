<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PurchasingPricingRequest extends FormRequest
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
            'supplier_id' => 'required|exists:suppliers,supplier_id',
            'stock_id' => 'required|exists:stock_master,stock_id',
            'price' => 'required|numeric|min:0',
            'suppliers_uom' => 'required|string|max:50',
            'conversion_factor' => 'required|numeric|min:0',
            'supplier_description' => 'nullable|string|max:255',
        ];

    }
}
