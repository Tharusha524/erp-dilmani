<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SuppTransRequest extends FormRequest
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
            'trans_no' => 'required|integer',
            'trans_type' => 'required|integer',
            'supplier_id' => 'required|integer',
            'reference' => 'nullable|string',
            'supp_reference' => 'nullable|string',
            'trans_date' => 'required|date',
            'due_date' => 'required|date',
            'ov_amount' => 'nullable|numeric',
            'ov_discount' => 'nullable|numeric',
            'ov_gst' => 'nullable|numeric',
            'rate' => 'nullable|numeric',
            'alloc' => 'nullable|numeric',
            'tax_included' => 'nullable|boolean'
        ];
    }
}
