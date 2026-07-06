<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SalesOrdersRequest extends FormRequest
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
            'trans_type' => 'required|integer',
            'version' => 'nullable|integer',
            'type' => 'nullable|integer',
            'debtor_no' => 'required|integer',
            'branch_code' => 'required|integer',
            'reference' => 'required|string|max:100',
            'comments' => 'nullable|string',
            'customer_ref' => 'nullable|string',
            'ord_date' => 'nullable|date',
            'order_type' => 'required|integer',
            'ship_via' => 'required|integer',
            'delivery_address' => 'nullable|string',
            'contact_phone' => 'nullable|string|max:30',
            'contact_email' => 'nullable|email|max:100',
            'deliver_to' => 'nullable|string',
            'freight_cost' => 'nullable|numeric',
            'from_stk_loc' => 'required|string|max:5',
            'delivery_date' => 'nullable|date',
            'payment_terms' => 'nullable|integer',
            'total' => 'numeric',
            'prep_amount' => 'numeric',
            'alloc' => 'numeric',
        ];
    }
}
