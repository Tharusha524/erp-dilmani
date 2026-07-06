<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DebtorTransRequest extends FormRequest
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
        if ($this->isMethod('post')) {
            return [
                'trans_no' => 'required|integer',
                'trans_type' => 'required|integer',
                'version' => 'nullable|integer',
                'debtor_no' => 'required|integer',
                'branch_code' => 'required|integer',
                'tran_date' => 'required|date',
                'due_date' => 'required|date',
                'reference' => 'nullable|string|max:60',
                'tpe' => 'nullable|integer',
                'order_no' => 'nullable|integer',
                'ov_amount' => 'nullable|numeric',
                'ov_gst' => 'nullable|numeric',
                'ov_freight' => 'nullable|numeric',
                'ov_freight_tax' => 'nullable|numeric',
                'ov_discount' => 'nullable|numeric',
                'alloc' => 'nullable|numeric',
                'prep_amount' => 'nullable|numeric',
                'rate' => 'nullable|numeric',
                'ship_via' => 'nullable|integer',
                'dimension_id' => 'nullable|integer',
                'dimension2_id' => 'nullable|integer',
                'payment_terms' => 'nullable|integer',
                'tax_included' => 'nullable|boolean',
            ];
        }

        if ($this->isMethod('put') || $this->isMethod('patch')) {
            return [
                'trans_no' => 'integer',
                'trans_type' => 'integer',
                'version' => 'nullable|integer',
                'debtor_no' => 'integer',
                'branch_code' => 'integer',
                'tran_date' => 'date',
                'due_date' => 'date',
                'reference' => 'nullable|string|max:60',
                'tpe' => 'nullable|integer',
                'order_no' => 'nullable|integer',
                'ov_amount' => 'nullable|numeric',
                'ov_gst' => 'nullable|numeric',
                'ov_freight' => 'nullable|numeric',
                'ov_freight_tax' => 'nullable|numeric',
                'ov_discount' => 'nullable|numeric',
                'alloc' => 'nullable|numeric',
                'prep_amount' => 'nullable|numeric',
                'rate' => 'nullable|numeric',
                'ship_via' => 'nullable|integer',
                'dimension_id' => 'nullable|integer',
                'dimension2_id' => 'nullable|integer',
                'payment_terms' => 'nullable|integer',
                'tax_included' => 'nullable|boolean',
            ];
        }

        return [];
    }
}
