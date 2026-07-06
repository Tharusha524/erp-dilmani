<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FixedAssetsLocationRequest extends FormRequest
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
            'locationCode' => 'required|string|max:5',
            'locationName' => 'required|string|max:60',
            'address' => 'required|string',
            'phone' => 'required|string|max:30',
            'secondaryPhone' => 'nullable|string|max:30',
            'fax' => 'required|string|max:30',
            'email' => 'required|email|max:100',
            'contact' => 'required|string|max:30',
            'fixedAsset' => 'boolean',
            'inactive' => 'boolean',
        ];
    }
}
