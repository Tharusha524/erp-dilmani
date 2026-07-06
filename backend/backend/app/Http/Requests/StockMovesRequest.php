<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StockMovesRequest extends FormRequest
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
            'trans_no' => 'nullable|integer',
            'stock_id' => 'required|exists:stock_master,stock_id',
            'type' => 'nullable|integer',
            'loc_code' => 'required|exists:inventory_locations,loc_code',
            'tran_date' => 'required|date',
            'price' => 'nullable|numeric',
            'reference' => 'nullable|string|max:40',
            'qty' => 'required|numeric',
            'standard_cost' => 'required|numeric',
        ];
    }
}
