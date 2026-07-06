<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WOManufactureRequest extends FormRequest
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
            'reference'    => 'nullable|string|max:100',
            'workorder_id' => 'required|exists:workorders,id',
            'quantity'     => 'required|numeric|min:0.0001',
            'date'         => 'nullable|date',
        ];
    }
}
