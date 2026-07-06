<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SalesOrderDetailsRequest extends FormRequest
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
            'order_no' => 'required|integer|exists:sales_orders,order_no',
            'trans_type' => 'required|integer|exists:trans_types,trans_type',
            'stk_code' => 'required|string|exists:stock_master,stock_id',

            'description' => 'nullable|string',
            'qty_sent' => 'numeric|min:0',
            'unit_price' => 'numeric|min:0',
            'quantity' => 'numeric|min:0',
            'invoiced' => 'numeric|min:0',
            'discount_percent' => 'numeric|min:0|max:100',
        ];
    }
}
