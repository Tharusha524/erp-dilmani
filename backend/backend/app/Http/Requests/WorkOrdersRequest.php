<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WorkOrdersRequest extends FormRequest
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
            'wo_ref'           => 'required|string|max:60',
            'loc_code'         => 'required|exists:inventory_locations,loc_code',
            'units_reqd'       => 'required|numeric|min:0.0001',
            'stock_id'         => 'required|exists:stock_master,stock_id',
            'date'             => 'nullable|date',
            'type'             => 'required|exists:trans_types,trans_type',
            'required_by'      => 'nullable|date',
            'released_date'    => 'nullable|date',
            'units_issued'     => 'numeric|min:0',
            'closed'           => 'boolean',
            'released'         => 'boolean',
            'additional_costs' => 'numeric|min:0',
        ];
    }
}
