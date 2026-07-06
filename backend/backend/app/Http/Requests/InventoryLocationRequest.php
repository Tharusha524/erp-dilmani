<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InventoryLocationRequest extends FormRequest
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
        $id = $this->route('inventory_location') ?? $this->id;

        return [
            'loc_code'        => [
                'required',
                'string',
                'max:255',
                Rule::unique('inventory_locations', 'loc_code')->ignore($id),
            ],
            'location_name'   => 'required|string|max:255',
            'delivery_address' => 'required|string',
            'phone'           => 'required|string|max:50',
            'phone2'          => 'required|string|max:50',
            'fax'             => 'required|string|max:50',
            'email'           => 'required|email|max:255',
            'contact'         => 'required|string|max:255',
            'inactive' => 'boolean',
        ];
    }
}
