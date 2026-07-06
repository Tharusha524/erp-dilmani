<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChartTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // For CREATE (POST)
        if ($this->isMethod('post')) {
            return [
                'id'        => 'required|string|max:10|unique:chart_types,id',
                'name'      => 'required|string|max:60',
                'class_id'  => 'required|string|exists:chart_class,cid',
                'parent'    => 'nullable|string|max:10',
                'inactive'  => 'boolean',
            ];
        }

        // For UPDATE (PUT/PATCH)
        if ($this->isMethod('put') || $this->isMethod('patch')) {
            return [
                'id'        => 'sometimes|string|max:10', // only if passed
                'name'      => 'sometimes|required|string|max:60',
                'class_id'  => 'sometimes|required|string|exists:chart_class,cid',
                'parent'    => 'nullable|string|max:10',
                'inactive'  => 'sometimes|boolean',
            ];
        }

        return [];
    }
}
