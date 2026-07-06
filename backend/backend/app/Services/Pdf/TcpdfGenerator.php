<?php

namespace App\Services\Pdf;

use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Http\Response;
use TCPDF;

class TcpdfGenerator
{
    public function __construct(private ViewFactory $viewFactory)
    {
    }

    public function downloadFromView(
        string $view,
        array $data,
        string $filename,
        string $orientation = 'P'
    ): Response {
        $pdfContent = $this->renderPdfContent($view, $data, $orientation);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'private, max-age=0, must-revalidate',
        ]);
    }

    public function streamFromView(
        string $view,
        array $data,
        string $filename,
        string $orientation = 'P'
    ): Response {
        $pdfContent = $this->renderPdfContent($view, $data, $orientation);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
            'Cache-Control' => 'private, max-age=0, must-revalidate',
        ]);
    }

    private function renderPdfContent(string $view, array $data, string $orientation): string
    {
        $html = $this->viewFactory->make($view, $data)->render();

        $pdf = new TCPDF(
            strtoupper($orientation) === 'L' ? 'L' : 'P',
            PDF_UNIT,
            PDF_PAGE_FORMAT,
            true,
            'UTF-8',
            false
        );

        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(10, 10, 10);
        $pdf->SetAutoPageBreak(true, 12);
        $pdf->setImageScale(PDF_IMAGE_SCALE_RATIO);
        $pdf->SetCreator(config('app.name', 'ERP'));
        $pdf->SetAuthor(config('app.name', 'ERP'));
        $pdf->SetTitle('ERP Report');
        // DejaVu Sans gives modern readable Unicode-safe output.
        $pdf->SetFont('dejavusans', '', 10);
        $pdf->AddPage();
        $pdf->writeHTML($html, true, false, true, false, '');

        return $pdf->Output('', 'S');
    }
}

