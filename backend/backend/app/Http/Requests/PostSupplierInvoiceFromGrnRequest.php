<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class PostSupplierInvoiceFromGrnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => 'required|integer|exists:suppliers,supplier_id',
            'reference' => 'nullable|string|max:60',
            'supp_reference' => 'nullable|string|max:60',
            'trans_date' => 'required|date',
            'due_date' => 'nullable|date',
            'tax_included' => 'boolean',
            'comments' => 'nullable|string',
            'lines' => 'nullable|array',
            'lines.*.grn_item_id' => 'required_with:lines|integer',
            'lines.*.quantity' => 'required_with:lines|numeric|min:0.0001',
            'gl_lines' => 'nullable|array',
            'gl_lines.*.gl_code' => 'required|string|max:15',
            'gl_lines.*.amount' => 'required|numeric',
            'gl_lines.*.memo' => 'nullable|string',
            'gl_lines.*.cost_center_id' => 'nullable|integer',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $lines = $this->input('lines', []);
            $glLines = $this->input('gl_lines', []);
            if ((! is_array($lines) || count($lines) === 0) && (! is_array($glLines) || count($glLines) === 0)) {
                $v->errors()->add('lines', 'At least one GRN line or GL line is required.');
            }
        });
    }
}
