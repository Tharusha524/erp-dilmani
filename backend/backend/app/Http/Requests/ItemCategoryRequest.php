<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ItemCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Allow all users for now; adjust if needed
    }

    public function rules(): array
    {
        $id = $this->route('item_category');

        return [
            'description' => [
                'required',
                'string',
                'max:255',
                Rule::unique('item_category', 'description')->ignore($id, 'category_id'),
            ],
            'dflt_tax_type' => 'required|integer|exists:item_tax_types,id',
            'dflt_units' => 'required|integer|exists:item_units,id',
            'dflt_mb_flag' => 'required|integer|exists:item_type,id',
            'dflt_sales_act' => 'required|string|max:50',
            'dflt_cogs_act' => 'required|string|max:50',
            'dflt_inventory_act' => 'required|string|max:50',
            'dflt_adjustment_act' => 'required|string|max:50',
            'dflt_wip_act' => 'required|string|max:50',
            'dflt_dim1' => 'nullable|integer',
            'dflt_dim2' => 'nullable|integer',
            'inactive' => 'boolean',
            'dflt_no_sale' => 'boolean',
            'dflt_no_purchase' => 'boolean',
        ];
    }

    public function messages(): array
    {

        return [
            'description.required' => 'The category description is required.',
            'description.unique' => 'This description already exists.',
            'dflt_tax_type.exists' => 'Invalid tax type selected.',
            'dflt_units.exists' => 'Invalid unit selected.',
        ];
    }
}
