<?php

namespace App\Services\Reports;

use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Excel export for reports built from ReportPdfBuilder's generic
 * headers/rows/totals structure. Reports that use a custom nested view
 * (Balance Sheet, Profit & Loss, grouped Journal Entries) aren't backed by
 * that structure and aren't supported here yet.
 */
class ReportExcelBuilder
{
    public function __construct(private ReportPdfBuilder $pdfBuilder)
    {
    }

    /**
     * @throws \InvalidArgumentException when the report has no generic
     *                                    headers/rows to export
     */
    public function build(string $reportKey, Request $request): string
    {
        $payload = $this->pdfBuilder->build($reportKey, $request);

        if (!isset($payload['headers'], $payload['rows'])) {
            throw new \InvalidArgumentException(
                'Excel export is not available yet for this report — please use PDF.'
            );
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(substr(preg_replace('/[\\\\\/\?\*\[\]:]/', ' ', (string) $payload['title']), 0, 31) ?: 'Report');

        $row = 1;

        $sheet->setCellValue("A{$row}", (string) $payload['title']);
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(14);
        $row++;

        if (!empty($payload['subtitle'])) {
            $sheet->setCellValue("A{$row}", (string) $payload['subtitle']);
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true);
            $row++;
        }

        $row++; // blank spacer row

        $headers = array_values($payload['headers']);
        $colCount = count($headers);

        foreach ($headers as $i => $header) {
            $col = $this->columnLetter($i);
            $sheet->setCellValue("{$col}{$row}", $header);
        }
        $headerRange = "A{$row}:" . $this->columnLetter($colCount - 1) . $row;
        $sheet->getStyle($headerRange)->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($headerRange)->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('1565C0');
        $row++;

        foreach ($payload['rows'] as $dataRow) {
            foreach (array_values($dataRow) as $i => $cell) {
                $col = $this->columnLetter($i);
                $sheet->setCellValue("{$col}{$row}", $this->cellValue($cell));
            }
            $row++;
        }

        if (!empty($payload['totals'])) {
            foreach (array_values($payload['totals']) as $i => $cell) {
                $col = $this->columnLetter($i);
                $sheet->setCellValue("{$col}{$row}", $this->cellValue($cell));
            }
            $totalsRange = "A{$row}:" . $this->columnLetter($colCount - 1) . $row;
            $sheet->getStyle($totalsRange)->getFont()->setBold(true);
            $row++;
        }

        foreach (range(0, $colCount - 1) as $i) {
            $sheet->getColumnDimension($this->columnLetter($i))->setAutoSize(true);
        }
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        $writer = new Xlsx($spreadsheet);
        $tmpPath = tempnam(sys_get_temp_dir(), 'report_xlsx_');
        $writer->save($tmpPath);
        $contents = file_get_contents($tmpPath);
        unlink($tmpPath);

        return $contents;
    }

    /** Convert "12,345.00"-style formatted strings back to numbers for proper Excel cells. */
    private function cellValue(string $raw): string|float
    {
        $trimmed = trim($raw);
        if ($trimmed === '' || $trimmed === '—' || $trimmed === '-') {
            return '';
        }
        $numericCandidate = str_replace(',', '', $trimmed);
        if (is_numeric($numericCandidate)) {
            return (float) $numericCandidate;
        }

        return $raw;
    }

    private function columnLetter(int $index): string
    {
        $letter = '';
        $n = $index + 1; // 1-based
        while ($n > 0) {
            $rem = ($n - 1) % 26;
            $letter = chr(65 + $rem) . $letter;
            $n = intdiv($n - $rem, 26);
        }

        return $letter;
    }
}
