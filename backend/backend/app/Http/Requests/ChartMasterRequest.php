<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChartMasterRequest extends FormRequest
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
    // Get the route parameter (usually ID or account_code)
    $chartMasterId = $this->route('chart_master');

    return [
        'account_code' => [
            'required',
            'string',
            'max:15',
            // Ignore the current record by its primary key
            Rule::unique('chart_master', 'account_code')->ignore($chartMasterId, 'account_code'),
        ],
        'account_code2' => 'nullable|string|max:15',
        'account_name' => 'required|string|max:60',
        'account_type' => 'required|string|exists:chart_types,id',
        'inactive' => 'boolean',
    ];
}


}
