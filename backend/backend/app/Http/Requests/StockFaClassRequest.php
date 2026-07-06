<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StockFaClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // CREATE
        if ($this->isMethod('post')) {
            return [
                'fa_class_id'        => 'required|string|max:255',
                'parent_id'          => 'required|string|max:255',
                'description'        => 'required|string|max:255',
                'long_description'   => 'required|string',
                'depreciation_rate'  => 'required|numeric|min:0',
                'inactive'           => 'boolean',
            ];
        }

        // UPDATE
        if ($this->isMethod('put') || $this->isMethod('patch')) {
            return [
                'parent_id'          => 'string|max:255',
                'description'        => 'string|max:255',
                'long_description'   => 'string',
                'depreciation_rate'  => 'numeric|min:0',
                'inactive'           => 'boolean',
            ];
        }

        return [];
    }
}
