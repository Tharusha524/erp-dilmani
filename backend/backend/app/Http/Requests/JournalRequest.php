<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class JournalRequest extends FormRequest
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
            'tran_date' => 'nullable|date',
            'reference' => 'nullable|string|max:60',
            'source_ref' => 'nullable|string|max:60',
            'event_date' => 'nullable|date',
            'doc_date' => 'nullable|date',
            'currency' => 'nullable|string|max:10', // Allow any currency code, don't validate against DB
            'amount' => 'required|numeric',
            'rate' => 'nullable|numeric|min:0',
        ];
    }
}
