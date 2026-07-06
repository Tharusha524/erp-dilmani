<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CrmPersonsRequest extends FormRequest
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
            'ref' => 'required|string|max:30',
            'name' => 'required|string|max:60',
            'name2' => 'nullable|string|max:60',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:30',
            'phone2' => 'nullable|string|max:30',
            'fax' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'lang' => 'nullable|string|max:5',
            'notes' => 'nullable|string',
            'inactive' => 'boolean',
        ];
    }

    protected function prepareForValidation(): void
    {
        $nullable = ['phone', 'phone2', 'fax', 'email', 'notes', 'address', 'name2', 'lang'];
        $merged = [];

        foreach ($nullable as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $merged[$key] = null;
            }
        }

        if ($merged !== []) {
            $this->merge($merged);
        }
    }
}
