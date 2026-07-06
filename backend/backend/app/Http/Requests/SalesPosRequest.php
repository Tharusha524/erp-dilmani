<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SalesPosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // allow all authenticated users
    }

    public function rules(): array
    {
        if ($this->isMethod('post')) {
            // Rules for creating a new POS
            return [
                'pos_name'     => 'required|string|max:255|unique:sales_pos,pos_name',
                'cash_sale'    => 'required|boolean',
                'credit_sale'  => 'required|boolean',
                'pos_location' => 'required|string|exists:inventory_locations,loc_code',
                'pos_account'  => 'required|integer|exists:bank_accounts,id',
                'inactive'     => 'required|boolean',
            ];
        }

        if ($this->isMethod('put') || $this->isMethod('patch')) {
            // Rules for updating an existing POS
            $salesPointId = $this->route('sales_point'); // apiResource uses singular name for route param
            
            return [
                'pos_name' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('sales_pos', 'pos_name')->ignore($salesPointId),
                ],
                'cash_sale'    => 'sometimes|boolean',
                'credit_sale'  => 'sometimes|boolean',
                'pos_location' => 'sometimes|string|exists:inventory_locations,loc_code',
                'pos_account'  => 'sometimes|integer|exists:bank_accounts,id',
                'inactive'     => 'sometimes|boolean',
            ];
        }

        return [];
    }

    public function messages(): array
    {
        return [
            'pos_name.required'      => 'POS name is required.',
            'pos_name.unique'        => 'This POS name already exists.',
            'cash_sale.required'     => 'Cash sale field is required.',
            'credit_sale.required'   => 'Credit sale field is required.',
            'pos_location.required'  => 'Location code is required.',
            'pos_location.exists'    => 'Invalid location code.',
            'pos_account.required'   => 'Bank account is required.',
            'pos_account.exists'     => 'Invalid bank account.',
            'inactive.required'      => 'Inactive field is required.',
        ];
    }
}
