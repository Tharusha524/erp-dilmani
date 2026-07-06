<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class PostSupplierCreditNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => 'required|integer|min:1',
            'trans_date' => 'required|date',
            'due_date' => 'nullable|date',
            'reference' => 'nullable|string|max:60',
            'supp_reference' => 'nullable|string|max:60',
            'tax_included' => 'boolean',
            'comments' => 'nullable|string',
            'source_invoice_trans_no' => 'nullable|integer|min:1',
            'allocations' => 'nullable|array',
            'allocations.*.trans_no_to' => 'required_with:allocations|integer',
            'allocations.*.trans_type_to' => 'required_with:allocations|integer',
            'allocations.*.amt' => 'required_with:allocations|numeric|min:0.01',
            'lines' => 'nullable|array',
            'lines.*.stock_id' => 'nullable|string|exists:stock_master,stock_id',
            'lines.*.quantity' => 'required_with:lines|numeric|min:0.0001',
            'lines.*.unit_price' => 'required_with:lines|numeric|min:0',
            'lines.*.grn_item_id' => 'nullable|integer',
            'lines.*.po_detail_item_id' => 'nullable|integer',
            'lines.*.description' => 'nullable|string',
            'gl_lines' => 'nullable|array',
            'gl_lines.*.gl_code' => 'required|string|max:15',
            'gl_lines.*.amount' => 'required|numeric',
            'gl_lines.*.memo' => 'nullable|string',
            'gl_lines.*.dimension_id' => 'nullable|integer',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $lines = $this->input('lines', []);
            $glLines = $this->input('gl_lines', []);
            if ((! is_array($lines) || count($lines) === 0) && (! is_array($glLines) || count($glLines) === 0)) {
                $v->errors()->add('lines', 'At least one stock line or GL line is required.');
            }
        });
    }
}
