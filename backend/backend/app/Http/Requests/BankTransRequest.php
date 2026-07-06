<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BankTransRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Allow all authenticated users (adjust if needed)
    }

    public function rules(): array
    {
        return [
            'bank_act'       => 'required|exists:bank_accounts,id',
            'trans_no'       => 'nullable|integer',
            'type'           => 'nullable|integer',
            'ref'            => 'nullable|string|max:255',
            'trans_date'     => 'required|date',
            'amount'         => 'nullable|numeric',
            'dimension_id'   => 'nullable|integer',
            'dimension2_id'  => 'nullable|integer',
            'person_type_id' => 'nullable|integer',
            'person_id'      => 'nullable',
            'reconciled'     => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            'bank_act.required' => 'Bank account is required.',
            'bank_act.exists'   => 'Invalid bank account.',
            'trans_date.required' => 'Transaction date is required.',
            'amount.numeric'    => 'Amount must be a valid number.',
        ];
    }
}
