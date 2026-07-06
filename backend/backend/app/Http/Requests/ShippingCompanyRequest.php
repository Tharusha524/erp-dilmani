<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ShippingCompanyRequest extends FormRequest
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
            'shipper_name' => 'required|string|max:60',
            'phone' => 'nullable|string|max:30',
            'phone2' => 'nullable|string|max:30',
            'contact' => 'required|string',
            'address' => 'required|string',
            'inactive' => 'boolean',
        ];
    }
}