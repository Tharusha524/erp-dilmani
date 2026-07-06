<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AuditTrailRequest extends FormRequest
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
            'type' => 'required|integer|min:0',
            'trans_no' => 'required|integer|min:0',
            'user' => 'required|integer|min:0',
            'description' => 'nullable|string|max:60',
            'fiscal_year' => 'required|exists:fiscal_years,id',
            'gl_date' => 'required|date',
            'gl_seq' => 'nullable|integer|min:0',
        ];
    }
}
