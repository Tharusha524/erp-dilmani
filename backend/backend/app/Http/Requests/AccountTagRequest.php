<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AccountTagRequest extends FormRequest
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
        if ($this->isMethod('post')) {
            return [
                'type' => 'required|integer',
                'name' => 'required|string|max:30',
                'description' => 'nullable|string|max:60',
                'inactive' => 'boolean',
            ];
        }

        if ($this->isMethod('put') || $this->isMethod('patch')) {
            return [
                'type' => 'integer',
                'name' => 'string|max:30',
                'description' => 'nullable|string|max:60',
                'inactive' => 'boolean',
            ];
        }

        return [];
    }
}
