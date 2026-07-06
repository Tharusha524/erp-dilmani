<?php

namespace App\Services\FiscalYear;

use App\Support\ActiveFiscalYear;
use App\Support\CompanySetupSettings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TransactionReferenceService
{
    /**
     * @return array{
     *     reference: string,
     *     suffix: string,
     *     sequence: int,
     *     fiscal_year_id: int|null,
     *     fiscal_year_from: string,
     *     fiscal_year_to: string,
     *     trans_type: int
     * }
     */
    public function next(int $transType, ?string $asOfDate = null): array
    {
        $range = ActiveFiscalYear::range($asOfDate);
        $suffix = ActiveFiscalYear::referenceSuffix($range['fiscal_year_from'], $range['fiscal_year_to']);
        $autoIncrease = CompanySetupSettings::autoIncreaseDocumentReferences();

        if (! $autoIncrease) {
            return [
                'reference' => null,
                'suffix' => $suffix,
                'sequence' => null,
                'fiscal_year_id' => $range['id'],
                'fiscal_year_from' => $range['fiscal_year_from'],
                'fiscal_year_to' => $range['fiscal_year_to'],
                'trans_type' => $transType,
                'auto_increase_of_document_references' => false,
                'manual_entry_required' => true,
            ];
        }

        $references = $this->collectReferences(
            $transType,
            $range['fiscal_year_from'],
            $range['fiscal_year_to']
        );

        $maxSequence = 0;
        foreach ($references as $reference) {
            $sequence = $this->parseSequence($reference, $suffix);
            if ($sequence > $maxSequence) {
                $maxSequence = $sequence;
            }
        }

        $nextSequence = $maxSequence + 1;
        $reference = str_pad((string) $nextSequence, 3, '0', STR_PAD_LEFT).'/'.$suffix;

        return [
            'reference' => $reference,
            'suffix' => $suffix,
            'sequence' => $nextSequence,
            'fiscal_year_id' => $range['id'],
            'fiscal_year_from' => $range['fiscal_year_from'],
            'fiscal_year_to' => $range['fiscal_year_to'],
            'trans_type' => $transType,
            'auto_increase_of_document_references' => true,
            'manual_entry_required' => false,
        ];
    }

    /**
     * @return list<string>
     */
    private function collectReferences(int $transType, string $from, string $to): array
    {
        $references = [];

        foreach ($this->sourcesForType($transType) as $source) {
            if (! Schema::hasTable($source['table'])) {
                continue;
            }

            $query = DB::table($source['table'])
                ->whereNotNull($source['reference_column'])
                ->where($source['reference_column'], '!=', '');

            if (! empty($source['type_column']) && ! empty($source['types'])) {
                $query->whereIn($source['type_column'], $source['types']);
            }

            if (! empty($source['date_column']) && Schema::hasColumn($source['table'], $source['date_column'])) {
                $query->whereDate($source['date_column'], '>=', $from)
                    ->whereDate($source['date_column'], '<=', $to);
            }

            $rows = $query->pluck($source['reference_column']);

            foreach ($rows as $row) {
                $value = trim((string) $row);
                if ($value !== '') {
                    $references[] = $value;
                }
            }
        }

        return $references;
    }

    /**
     * @return list<array{
     *     table: string,
     *     types: list<int>,
     *     type_column: string|null,
     *     date_column: string|null,
     *     reference_column: string
     * }>
     */
    private function sourcesForType(int $transType): array
    {
        $all = [
            [
                'table' => 'sales_orders',
                'types' => [30, 32],
                'type_column' => 'trans_type',
                'date_column' => 'ord_date',
                'reference_column' => 'reference',
            ],
            [
                'table' => 'debtor_trans',
                'types' => [10, 11, 12, 13],
                'type_column' => 'trans_type',
                'date_column' => 'tran_date',
                'reference_column' => 'reference',
            ],
            [
                'table' => 'supp_trans',
                'types' => [20, 21, 22],
                'type_column' => 'trans_type',
                'date_column' => 'tran_date',
                'reference_column' => 'reference',
            ],
            [
                'table' => 'stock_moves',
                'types' => [16, 17],
                'type_column' => 'type',
                'date_column' => 'tran_date',
                'reference_column' => 'reference',
            ],
            [
                'table' => 'journal',
                'types' => [0, 1, 2, 4],
                'type_column' => 'type',
                'date_column' => 'tran_date',
                'reference_column' => 'reference',
            ],
            [
                'table' => 'grn_batch',
                'types' => [25],
                'type_column' => null,
                'date_column' => 'delivery_date',
                'reference_column' => 'reference',
            ],
            [
                'table' => 'purch_orders',
                'types' => [18],
                'type_column' => null,
                'date_column' => 'ord_date',
                'reference_column' => 'reference',
            ],
        ];

        return array_values(array_filter(
            $all,
            fn (array $source) => in_array($transType, $source['types'], true)
        ));
    }

    private function parseSequence(string $reference, string $suffix): int
    {
        $reference = trim($reference);
        $suffixPattern = preg_quote($suffix, '/');

        if (! preg_match('/^(\d+)\/'.$suffixPattern.'$/', $reference, $matches)) {
            return 0;
        }

        return max(0, (int) $matches[1]);
    }
}
