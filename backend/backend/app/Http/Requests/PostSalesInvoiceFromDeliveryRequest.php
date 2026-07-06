<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostSalesInvoiceFromDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'delivery_trans_no' => 'required|integer|min:1',
            'tran_date' => 'required|date',
            'due_date' => 'nullable|date',
            'ship_via' => 'nullable|integer',
            'freight_cost' => 'nullable|numeric|min:0',
            'payment_terms' => 'nullable|integer',
            'comments' => 'nullable|string',
            'reference' => 'nullable|string|max:60',
            'lines' => 'required|array|min:1',
            'lines.*.delivery_detail_id' => 'required|integer|exists:debtor_trans_details,id',
            'lines.*.quantity' => 'required|numeric|min:0.0001',
        ];
    }
}
