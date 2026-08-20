<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InternalServiceInvoiceRequest extends FormRequest
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
            'debtor_no' => 'nullable|integer',
            'branch_code' => 'nullable|integer',
            'tran_date' => 'required|date',
            'due_date' => 'nullable|date',
            'order_type' => 'nullable|integer',
            'ship_via' => 'nullable|integer',
            'payment_terms' => 'nullable|integer',
            'freight_cost' => 'nullable|numeric|min:0',
            'from_stk_loc' => 'nullable|string|max:30',
            'customer_ref' => 'nullable|string|max:100',
            'cost_center_id' => 'nullable|integer',
            'delivery_address' => 'nullable|string',
            'deliver_to' => 'nullable|string|max:255',
            'comments' => 'nullable|string',
            'reference' => 'nullable|string|max:60',
            'cash_sale' => 'nullable|boolean',
            'bank_account_id' => 'nullable|integer',
            'lines' => 'required|array|min:1',
            'lines.*.stock_id' => 'nullable|string|max:30',
            'lines.*.quantity' => 'required|numeric|min:0',
            'lines.*.unit_price' => 'required|numeric|min:0',
            'lines.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'lines.*.description' => 'nullable|string|max:255',
        ];
    }
}
