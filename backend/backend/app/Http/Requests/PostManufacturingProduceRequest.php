<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostManufacturingProduceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'workorder_id' => 'required|integer|exists:workorders,id',
            'reference' => 'nullable|string|max:100',
            'quantity' => 'required|numeric|min:0.0001',
            'date' => 'required|date',
            'memo' => 'nullable|string',
            'close' => 'nullable|boolean',
        ];
    }
}
