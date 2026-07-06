<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WORequirementsRequest extends FormRequest
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
            'workorder_id' => 'required|exists:workorders,id',
            'stock_id'     => 'required|exists:stock_master,stock_id',
            'work_centre'  => 'required|exists:work_centres,id',
            'units_req'    => 'required|numeric|min:0',
            'unit_cost'    => 'required|numeric|min:0',
            'loc_code'     => 'required|exists:inventory_locations,loc_code',
            'units_issued' => 'nullable|numeric|min:0'
        ];
    }
}
