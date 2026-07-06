<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CrmContactRequest extends FormRequest
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
            'person_id' => 'required|exists:crm_persons,id',
            'type' => 'required|exists:crm_categories,id',
            'action' => 'required|string|max:20',
            'entity_id' => 'nullable|string|max:11',
        ];
    }
}
