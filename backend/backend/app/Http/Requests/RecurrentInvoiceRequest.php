<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecurrentInvoiceRequest extends FormRequest
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
        $id = $this->route('id') 
            ?? $this->route('recurrent_invoice') 
            ?? null;

        return [
            'description' => 'required|string|max:60|unique:recurrent_invoices,description' . ($id ? ',' . $id : ''),
            'order_no'    => 'required|integer',
            'debtor_no'   => 'nullable|integer',
            'group_no'    => 'nullable|integer',
            'days'        => 'required|integer|min:0',
            'monthly'     => 'required|integer|min:0',
            'begin'       => 'required|date',
            'end'         => 'required|date|after_or_equal:begin',
            'last_sent'   => 'required|date',
        ];
    }
}
