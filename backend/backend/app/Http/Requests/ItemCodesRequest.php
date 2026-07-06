<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ItemCodesRequest extends FormRequest
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
            'item_code' => 'required|string|max:20',
            'stock_id' => 'required|exists:stock_master,stock_id',
            'description' => 'nullable|string|max:200',
            'category_id' => 'required|exists:item_category,category_id',
            'quantity' => 'required|integer|min:1',
            'is_foreign' => 'boolean',
            'inactive' => 'boolean',
        ];
    }
}
