<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExchangeRateRequest extends FormRequest
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
            'curr_code' => 'exists:currencies,currency_abbreviation',
            'rate_buy' => 'numeric|min:0',
            'rate_sell' => 'numeric|min:0',
            'date' => 'required|date',
        ];
    }

    protected function prepareForValidation(): void
    {
        $buy = $this->input('rate_buy');
        $sell = $this->input('rate_sell');

        $buyNum = is_numeric($buy) ? (float) $buy : 0.0;
        $sellNum = is_numeric($sell) ? (float) $sell : 0.0;

        if ($buyNum > 0.000001 && $sellNum <= 0.000001) {
            $this->merge(['rate_sell' => $buyNum]);
        } elseif ($sellNum > 0.000001 && $buyNum <= 0.000001) {
            $this->merge(['rate_buy' => $sellNum]);
        }
    }
}
