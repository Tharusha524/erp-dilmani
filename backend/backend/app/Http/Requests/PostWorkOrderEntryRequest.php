<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostWorkOrderEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'wo_ref' => 'required|string|max:60',
            'loc_code' => 'required|exists:inventory_locations,loc_code',
            'units_reqd' => 'required|numeric|min:0.0001',
            'stock_id' => 'required|exists:stock_master,stock_id',
            'date' => 'nullable|date',
            'type' => 'required|integer|in:0,1,2',
            'required_by' => 'nullable|date',
            'memo' => 'nullable|string',
            'labour_cost' => 'nullable|numeric|min:0',
            'labour_credit_account' => 'nullable|string|exists:chart_master,account_code',
            'overhead_cost' => 'nullable|numeric|min:0',
            'overhead_credit_account' => 'nullable|string|exists:chart_master,account_code',
        ];
    }
}
