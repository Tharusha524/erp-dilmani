<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserProfileRequest extends FormRequest
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
        $id = $this->route('user-profile'); // for update

        return [
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'epf'        => 'required|string|max:50',
            'telephone'  => 'nullable|string|max:15',
            'address'    => 'nullable|string|max:255',
            'email'      => 'required|email|max:255|unique:user_profiles,email,' . $id,
            'password'   => $this->isMethod('post') ? 'required|string|min:6' : 'sometimes|string|min:6',
            'role'       => 'required|exists:security_roles,role',
            'status'     => 'required',
            'image'      => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];
    }
}
