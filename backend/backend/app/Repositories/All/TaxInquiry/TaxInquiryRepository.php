<?php

namespace App\Repositories\All\TaxInquiry;

use App\Models\TaxType;
use App\Repositories\Base\BaseRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TaxInquiryRepository extends BaseRepository implements TaxInquiryInterface
{
    public function __construct(TaxType $model)
    {
        parent::__construct($model);
    }

    public function search(array $filters)
    {
        $table = Schema::hasTable('trans_tax_details') ? 'trans_tax_details' : 'trans_tax_detail';
        if (! Schema::hasTable($table)) {
            return collect();
        }

        $fromDate = $filters['fromDate'] ?? '';
        $toDate = $filters['toDate'] ?? '';

        $query = DB::table($table.' as ttd')
            ->leftJoin('tax_types', 'ttd.tax_type_id', '=', 'tax_types.id')
            ->select(
                DB::raw('CAST(tax_types.id AS CHAR) as type'),
                'tax_types.description',
                DB::raw('SUM(ttd.amount) as amount'),
                DB::raw('SUM(ttd.net_amount) as net_amount'),
                DB::raw('SUM(CASE WHEN ttd.reg_type = 1 THEN ttd.amount ELSE 0 END) as outputs'),
                DB::raw('SUM(CASE WHEN ttd.reg_type = 0 THEN ttd.amount ELSE 0 END) as inputs')
            )
            ->groupBy('tax_types.id', 'tax_types.description');

        if (! empty($fromDate)) {
            $query->where('ttd.tran_date', '>=', $fromDate);
        }
        if (! empty($toDate)) {
            $query->where('ttd.tran_date', '<=', $toDate);
        }

        return $query->get()->map(function ($row) {
            $row->outputsInputs = ((float) $row->outputs) - ((float) $row->inputs);

            return $row;
        });
    }
}
