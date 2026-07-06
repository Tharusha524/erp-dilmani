<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WOIssueItemsRequest extends FormRequest
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
            'stock_id'   => 'nullable|exists:stock_master,stock_id',
            'issue_id'   => 'nullable|exists:wo_issues,issue_no',
            'qty_issued' => 'nullable|numeric|min:0',
            'unit_cost'  => 'required|numeric|min:0',
        ];
    }
}
