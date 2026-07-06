<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreditStatusSetupRequest extends FormRequest
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
            'reason_description' => 'required|string|max:255',
            'disallow_invoices' => 'required|boolean',
            'inactive' => 'boolean',
        ];
    }
}
