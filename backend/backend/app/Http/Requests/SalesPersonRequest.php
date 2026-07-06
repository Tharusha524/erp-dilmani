<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SalesPersonRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'telephone' => 'nullable|string|max:50',
            'fax' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'provision' => 'nullable|numeric',
            'turnover_break_point' => 'nullable|numeric',
            'provision2' => 'nullable|numeric',
            'inactive' => 'boolean',
        ];
    }
}
