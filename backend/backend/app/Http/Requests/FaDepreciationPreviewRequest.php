<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FaDepreciationPreviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period_date' => 'required|date',
        ];
    }
}
