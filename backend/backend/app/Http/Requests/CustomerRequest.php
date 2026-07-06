<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerRequest extends FormRequest
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
            'customer_name' => 'required|string|max:255',
            'customer_short_name' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'gst_number' => 'nullable|string|max:50',
            'currency' => 'required|string|max:10',
            'sales_type' => 'required|string|max:50',
            'phone' => 'nullable|string|max:50',
            'secondary_phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'bank_account' => 'nullable|string|max:100',
            'sales_person' => 'nullable|string|max:255',
            'discount_percent' => 'nullable|numeric',
            'prompt_payment_discount' => 'nullable|numeric',
            'credit_limit' => 'nullable|numeric',
            'payment_terms' => 'required|string|max:100',
            'credit_status' => 'required|string|max:100',
            'general_notes' => 'nullable|string',
            'default_inventory_location' => 'nullable|string|max:255',
            'default_shipping_company' => 'nullable|string|max:255',
            'sales_area' => 'nullable|string|max:255',
            'tax_group' => 'nullable|string|max:255',
        ];
    }
}
