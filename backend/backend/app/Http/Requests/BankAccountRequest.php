<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BankAccountRequest extends FormRequest
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
            'bank_account_name' => 'required|string|max:60',
            'account_type' => 'required|exists:account_types,id',
            'bank_curr_code' => 'required|exists:currencies,currency_abbreviation',
            'default_curr_act' => 'boolean',
            'account_gl_code' => 'required|exists:chart_master,account_code',
            'bank_charges_act' => 'required|exists:chart_master,account_code',
            'bank_name' => 'required|string|max:60',
            'bank_account_number' => 'required|string|max:100',
            'bank_address' => 'nullable|string',
            'last_reconciled_date' => 'nullable|date',
            'ending_reconcile_balance' => 'numeric',
            'inactive' => 'boolean',
        ];
    }
}
