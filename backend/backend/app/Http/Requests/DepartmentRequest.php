<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentRequest extends FormRequest
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
        $departmentParam = $this->route('department');
        $id = $departmentParam instanceof \Illuminate\Database\Eloquent\Model
            ? $departmentParam->getKey()
            : $departmentParam;

        return [
            'department' => ['required', 'string', 'max:100', Rule::unique('departments', 'department')->ignore($id)],
            'description' => 'nullable|string|max:255',
            'inactive' => 'boolean',
        ];
    }
}
