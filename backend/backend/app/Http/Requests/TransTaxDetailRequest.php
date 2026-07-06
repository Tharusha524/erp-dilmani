<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransTaxDetailRequest extends FormRequest
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
            'trans_type' => 'nullable|integer',
            'trans_no' => 'nullable|integer',
            'tran_date' => 'required|date',

            'tax_type_id' => 'required|integer|min:0',

            'rate' => 'required|numeric|min:0',
            'ex_rate' => 'required|numeric|min:0',

            'included_in_price' => 'required|boolean',

            'net_amount' => 'required|numeric|min:0',
            'amount' => 'required|numeric|min:0',

            'memo' => 'nullable|string|max:255',
            'reg_type' => 'nullable|integer',
        ];
    }
}
