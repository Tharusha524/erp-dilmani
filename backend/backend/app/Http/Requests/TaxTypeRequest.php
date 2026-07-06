<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TaxTypeRequest extends FormRequest
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
        $id = $this->route('tax_type');

        return [
            'description' => 'required|string|max:255',
            'default_rate' => 'required|numeric|min:0',
            'sales_gl_account' => 'required|string|max:255',
            'purchasing_gl_account' => 'required|string|max:255',
            'inactive' => 'boolean',
        ];
    }
}
