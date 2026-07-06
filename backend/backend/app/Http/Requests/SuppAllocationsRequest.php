<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SuppAllocationsRequest extends FormRequest
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
            'person_id'        => 'nullable|exists:suppliers,supplier_id',
            'amount'           => 'nullable|numeric|min:0',
            'date_alloc'       => 'nullable|date',
            'trans_no_from'    => 'nullable|integer',
            'trans_type_from'  => 'nullable|exists:trans_types,trans_type',
            'trans_no_to'      => 'nullable|integer',
            'trans_type_to'    => 'nullable|exists:trans_types,trans_type',
        ];
    }
}
