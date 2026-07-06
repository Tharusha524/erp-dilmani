<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostManufacturingIssueRequest extends FormRequest
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
            'issue_date' => 'required|date',
            'loc_code' => 'required|exists:inventory_locations,loc_code',
            'work_centre' => 'nullable|integer|exists:work_centres,id',
            'memo' => 'nullable|string',
            'return_to_inventory' => 'nullable|boolean',
            'lines' => 'required|array|min:1',
            'lines.*.stock_id' => 'required|string|exists:stock_master,stock_id',
            'lines.*.quantity' => 'required|numeric|min:0.0001',
            'lines.*.unit_cost' => 'nullable|numeric|min:0',
        ];
    }
}
