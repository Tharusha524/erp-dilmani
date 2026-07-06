<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RefLineRequest extends FormRequest
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
            'trans_type' => 'required|integer',
            'prefix' => 'required|string|max:5',
            'pattern' => 'required|string|max:35',
            'memo' => 'string|max:60',
            'default' => 'boolean',
            'inactive' => 'boolean',
        ];
    }
}
