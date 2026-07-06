<?php

namespace App\Http\Requests;

use App\Support\ItemMbFlag;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class BomRequest extends FormRequest
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
            'parent' => 'required|string|exists:stock_master,stock_id',
            'component' => 'required|string|exists:stock_master,stock_id',
            'work_centre' => 'required|integer|exists:work_centres,id',
            'loc_code' => 'required|string|max:5|exists:inventory_locations,loc_code',
            'quantity' => 'required|numeric',
        ];
    }

    public function messages(): array
    {
        return [
            'loc_code.max' => 'Location code must be 5 characters or less (e.g. WH001 instead of WH-001). Edit the location in Items & Inventory → Inventory Locations.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $component = trim((string) $this->input('component', ''));
            $parent = trim((string) $this->input('parent', ''));

            if ($component !== '' && $component === $parent) {
                $validator->errors()->add('component', 'A bill of material cannot list an item as its own component.');

                return;
            }

            if ($component === '') {
                return;
            }

            $item = DB::table('stock_master')->where('stock_id', $component)->first();
            if (! $item) {
                return;
            }

            $mbFlag = (int) ($item->mb_flag ?? 0);
            if ($mbFlag !== ItemMbFlag::MANUFACTURED) {
                return;
            }

            $isSubAssembly = DB::table('bom')->where('parent', $component)->exists();
            if (! $isSubAssembly) {
                $validator->errors()->add(
                    'component',
                    'Use a Purchased or Service item as a BOM component. Manufactured items are only valid when they have their own bill of material (sub-assembly).'
                );
            }
        });
    }
}
