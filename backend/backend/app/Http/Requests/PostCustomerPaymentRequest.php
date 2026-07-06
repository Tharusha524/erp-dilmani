<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostCustomerPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'debtor_no' => 'required|integer|min:1',
            'branch_code' => 'required|integer|min:1',
            'tran_date' => 'required|date',
            'bank_account_id' => 'required|integer|min:1',
            'amount' => 'required|numeric|min:0.01',
            'discount' => 'nullable|numeric|min:0',
            'bank_charge' => 'nullable|numeric|min:0',
            'reference' => 'nullable|string|max:60',
            'comments' => 'nullable|string',
            'dimension_id' => 'nullable|integer',
            'allocations' => 'nullable|array',
            'allocations.*.trans_no_to' => 'required_with:allocations|integer',
            'allocations.*.trans_type_to' => 'required_with:allocations|integer',
            'allocations.*.amt' => 'required_with:allocations|numeric|min:0.01',
        ];
    }
}
