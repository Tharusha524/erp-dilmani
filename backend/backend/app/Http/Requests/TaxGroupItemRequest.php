<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TaxGroupItemRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'tax_group_id' => 'required|exists:tax_groups,id',
            'tax_type_id' => 'required|exists:tax_types,id',
            'tax_shipping' => 'required|boolean',
        ];
    }

    /**
     * Customize validation messages (optional but nice for clarity)
     */
    public function messages(): array
    {
        return [
            'tax_group_id.required' => 'A tax group ID is required.',
            'tax_group_id.exists' => 'The selected tax group does not exist.',
            'tax_type_id.required' => 'A tax type ID is required.',
            'tax_type_id.exists' => 'The selected tax type does not exist.',
            'tax_shipping.required' => 'Please specify if this is for shipping tax.',
            'tax_shipping.boolean' => 'Shipping tax must be true or false.',
        ];
    }
}
