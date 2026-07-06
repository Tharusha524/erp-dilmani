<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ItemTaxTypeExceptionRequest extends FormRequest
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
            'item_tax_type_id' => [
                'required',
                'integer',
                'exists:item_tax_types,id',
            ],
            'tax_type_id' => [
                'required',
                'integer',
                'exists:tax_types,id',
            ],
        ];

    }
}
