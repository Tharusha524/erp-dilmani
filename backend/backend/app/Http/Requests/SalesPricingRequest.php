<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SalesPricingRequest extends FormRequest
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
            'currency_id' => 'required|exists:currencies,id',
            'stock_id' => 'required|exists:stock_master,stock_id',
            'sales_type_id' => 'required|exists:sales_types,id',
            'price' => 'required|numeric|min:0',
        ];
    }
}
