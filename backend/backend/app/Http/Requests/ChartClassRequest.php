<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChartClassRequest extends FormRequest
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
            'cid' => 'required|string|max:3',
            'class_name' => 'required|string|max:60',
            'ctype' => 'required|integer|min:0|max:10',
            'inactive' => 'boolean',
        ];
    }
}
