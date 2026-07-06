<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerBranchRequest extends FormRequest
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
            'debtor_no' => 'required|exists:debtors_master,debtor_no',
            'br_name' => 'required|string|max:60',
            'branch_ref' => 'required|string|max:30',
            'br_address' => 'required|string',
            'sales_area' => 'nullable|exists:sales_areas,id',
            'sales_person' => 'nullable|exists:sales_people,id',
            'inventory_location' => 'nullable|exists:inventory_locations,loc_code',
            'tax_group' => 'nullable|exists:tax_groups,id',
            'sales_account' => 'nullable|string|max:15',
            'sales_discount_account' => 'nullable|string|max:15',
            'receivables_account' => 'nullable|string|max:15',
            'payment_discount_account' => 'nullable|string|max:15',
            'shipping_company' => 'nullable|exists:shipping_companies,shipper_id',
            'br_post_address' => 'nullable|string',
            'sales_group' => 'nullable|exists:sales_groups,id',
            'notes' => 'nullable|string',
            'bank_account' => 'nullable|string|max:60',
            'inactive' => 'boolean',
        ];
    }
}
