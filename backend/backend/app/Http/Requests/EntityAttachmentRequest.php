<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EntityAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $types = ['customer', 'supplier', 'item', 'fixed_asset'];

        if ($this->isMethod('post')) {
            return [
                'entity_type' => ['required', Rule::in($types)],
                'entity_id' => 'required|string|max:64',
                'doc_title' => 'required|string|max:255',
                'doc_date' => 'required|date',
                'file' => 'required|file|max:10240',
                'inactive' => 'boolean',
            ];
        }

        return [
            'doc_title' => 'sometimes|string|max:255',
            'doc_date' => 'sometimes|date',
            'file' => 'sometimes|file|max:10240',
            'inactive' => 'boolean',
        ];
    }
}
