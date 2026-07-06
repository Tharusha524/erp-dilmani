<?php

namespace App\Http\Requests;

use App\Support\PasswordRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserManagementRequest extends FormRequest
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
        // try several common route parameter names and handle model instance
        $userParam = $this->route('user-management') ?? $this->route('user_management') ?? $this->route('user') ?? $this->route('user-managements');
        $id = null;
        if ($userParam) {
            $id = $userParam instanceof \Illuminate\Database\Eloquent\Model ? $userParam->getKey() : $userParam;
        }

        $rules = [
            'first_name' => 'string|max:255',
            'last_name' => 'string|max:255',
            'department' => 'nullable|string|max:255',
            'epf' => 'string|max:50',
            'telephone' => 'nullable|string|max:15',
            'address' => 'nullable|string|max:255',
            'email' => ['email', 'max:255', Rule::unique('user_managements', 'email')->ignore($id)],
            'password' => ['string', PasswordRules::defaults()],
            'role' => 'string', // Assuming validation via foreign key elsewhere
            'status' => 'string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'remove_image' => 'sometimes|boolean',
        ];

        // For create (no $id), add 'required' to mandatory fields
        if (! $id) {
            $rules['first_name'] = 'required|' . $rules['first_name'];
            $rules['last_name'] = 'required|' . $rules['last_name'];
            $rules['epf'] = 'required|' . $rules['epf'];
            $rules['email'] = ['required', 'email', 'max:255', Rule::unique('user_managements', 'email')];
            $rules['password'] = ['required', PasswordRules::defaults()];
            $rules['role'] = 'required|' . $rules['role'];
            $rules['status'] = 'required|' . $rules['status'];
        } else {
            // For update ($id exists), make fields 'sometimes' (validate only if provided)
            // This allows partial updates (e.g., only image)
            $rules['first_name'] = 'sometimes|' . $rules['first_name'];
            $rules['last_name'] = 'sometimes|' . $rules['last_name'];
            $rules['epf'] = 'sometimes|' . $rules['epf'];
            $rules['email'] = ['sometimes', 'email', 'max:255', Rule::unique('user_managements', 'email')->ignore($id)];
            $rules['role'] = 'sometimes|' . $rules['role'];
            $rules['status'] = 'sometimes|' . $rules['status'];
            $rules['password'] = ['sometimes', 'nullable', PasswordRules::defaults()];
        }

        return $rules;
    }
}
