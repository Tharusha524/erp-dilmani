<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WOCostingRequest extends FormRequest
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
            'cost_type'    => 'required|integer',
            'trans_type'   => 'required|exists:trans_types,trans_type',
            'trans_no'     => 'required|integer',
            'factor'       => 'required|numeric|min:0',
        ];
    }
}
