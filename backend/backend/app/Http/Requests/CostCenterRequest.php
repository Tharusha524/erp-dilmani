<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CostCenterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reference' => 'required|string|max:60',
            'name' => 'required|string|max:255',
            'type' => 'required|integer|in:1,2',
            'start_date' => 'nullable|date',
            'date_required_by' => 'nullable|date',
            'tag_id' => 'nullable|exists:cost_center_tags,id',
            'memo' => 'nullable|string',
            'closed' => 'nullable|boolean',
        ];
    }
}
