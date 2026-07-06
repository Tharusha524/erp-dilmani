<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WOIssuesRequest extends FormRequest
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
            'issue_no'     => 'required|integer',
            'workorder_id' => 'required|exists:workorders,id',
            'reference'    => 'nullable|string|max:100',
            'issue_date'   => 'nullable|date',
            'loc_code'     => 'nullable|exists:inventory_locations,loc_code',
            'work_centre'  => 'nullable|exists:work_centres,id',
        ];
    }
}
