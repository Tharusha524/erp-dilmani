<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FaDepreciationProcessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period_date' => 'required|date',
            'reference' => 'nullable|string|max:60',
            'stock_ids' => 'nullable|array',
            'stock_ids.*' => 'string',
        ];
    }
}
