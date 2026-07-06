<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentTermRequest extends FormRequest
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
            'description' => 'required|string|max:80',
            'payment_type' => 'required|exists:payment_types,id',
            'days_before_due' => 'required|integer|min:0',
            'day_in_following_month' => 'required|integer|min:0',
            'inactive' => 'boolean',
        ];
    }
}
