<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CrmCategoryRequest extends FormRequest
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
            'type' => 'required|string|max:20',
            'subtype' => 'required|string|max:20',
            'name' => 'required|string|max:30',
            'description' => 'required|string',
            'systm' => 'required|boolean',
            'inactive' => 'required|boolean',
        ];
    }
}
