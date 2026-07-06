<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LocStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'loc_code' => 'required|exists:inventory_locations,loc_code',
            'stock_id' => 'required|exists:stock_master,stock_id',
            'reorder_level' => 'required|numeric|min:0',
        ];
    }
}
