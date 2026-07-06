<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostManufacturingReleaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'released_date' => 'required|date',
            'memo' => 'nullable|string',
        ];
    }
}
