<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostManufacturingCostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'workorder_id' => 'required|integer|exists:workorders,id',
            'reference' => 'nullable|string|max:100',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0.0001',
            'cost_type' => 'nullable|integer|in:0,1',
            'credit_account' => 'required|string|exists:chart_master,account_code',
            'memo' => 'nullable|string',
        ];
    }
}
