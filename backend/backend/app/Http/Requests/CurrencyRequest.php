<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CurrencyRequest extends FormRequest
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
        $id = $this->route('currency');
        
        return [
            'currency_abbreviation' => 'required|string|max:10|unique:currencies,currency_abbreviation,' . $id,
            'currency_symbol' => 'required|string|max:10',
            'currency_name' => 'required|string|max:255',
            'hundredths_name' => 'nullable|string|max:255',
            'country' => 'required|string|max:255',
            'auto_exchange_rate_update' => 'sometimes|boolean',
            'inactive' => 'boolean',
        ];
    }
}