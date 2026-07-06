<?php

namespace App\Services\Sales;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class RecurrentInvoiceService
{
    public function __construct(
        private SalesInvoiceService $invoiceService,
    ) {}

    /**
     * FrontAccounting create_recurrent_invoices() — clone template SO and direct invoice.
     *
     * @return array<string, mixed>
     */
    public function generate(int $recurrentId, ?string $invoiceDate = null): array
    {
        if (! Schema::hasTable('recurrent_invoices')) {
            throw new InvalidArgumentException('Recurrent invoices are not configured.');
        }

        $def = DB::table('recurrent_invoices')->where('id', $recurrentId)->first();
        if (! $def) {
            throw new InvalidArgumentException('Recurrent invoice definition not found.');
        }

        $templateOrderNo = (int) ($def->order_no ?? 0);
        $template = DB::table('sales_orders')->where('order_no', $templateOrderNo)->first();
        if (! $template) {
            throw new InvalidArgumentException("Template sales order #{$templateOrderNo} not found.");
        }

        $details = DB::table('sales_order_details')->where('order_no', $templateOrderNo)->get();
        if ($details->isEmpty()) {
            throw new InvalidArgumentException('Template order has no lines.');
        }

        $tranDate = $invoiceDate ?? now()->toDateString();
        $lines = $details->map(fn ($d) => [
            'stock_id' => (string) $d->stk_code,
            'quantity' => (float) $d->quantity,
            'unit_price' => (float) $d->unit_price,
            'discount_percent' => (float) ($d->discount_percent ?? 0),
            'description' => $d->description,
        ])->all();

        $result = $this->invoiceService->directInvoice([
            'debtor_no' => (int) $template->debtor_no,
            'branch_code' => (int) $template->branch_code,
            'tran_date' => $tranDate,
            'due_date' => $tranDate,
            'order_type' => (int) ($template->order_type ?? 0),
            'ship_via' => (int) ($template->ship_via ?? 1),
            'payment_terms' => $template->payment_terms,
            'freight_cost' => (float) ($template->freight_cost ?? 0),
            'from_stk_loc' => (string) ($template->from_stk_loc ?? ''),
            'customer_ref' => $template->customer_ref ?? '',
            'delivery_address' => $template->delivery_address ?? '',
            'deliver_to' => $template->deliver_to ?? '',
            'comments' => 'Recurrent: '.($def->description ?? ''),
            'lines' => $lines,
        ]);

        DB::table('recurrent_invoices')->where('id', $recurrentId)->update([
            'last_sent' => $tranDate,
            'last_invoice_trans_no' => (int) ($result['trans_no'] ?? 0) ?: null,
            'last_invoice_reference' => (string) ($result['reference'] ?? ''),
            'updated_at' => now(),
        ]);

        return array_merge($result, [
            'recurrent_invoice_id' => $recurrentId,
            'message' => 'Recurrent invoice generated.',
        ]);
    }

    /**
     * FrontAccounting create_recurrent_invoices() batch — generate all definitions due as of date.
     *
     * @return array{generated: int, results: array<int, array<string, mixed>>, errors: array<int, string>}
     */
    public function generateAllDue(?string $asOfDate = null): array
    {
        $asOf = $asOfDate ?? now()->toDateString();
        $due = $this->dueList($asOf);
        $results = [];
        $errors = [];

        foreach ($due as $row) {
            $id = (int) ($row['id'] ?? 0);
            if ($id <= 0) {
                continue;
            }

            if (! $this->isDue($row, $asOf)) {
                continue;
            }

            try {
                $results[] = $this->generate($id, $asOf);
            } catch (\Throwable $e) {
                $errors[] = "Recurrent #{$id}: ".$e->getMessage();
            }
        }

        return [
            'generated' => count($results),
            'results' => $results,
            'errors' => $errors,
            'as_of' => $asOf,
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function isDue(array $row, string $asOf): bool
    {
        $begin = (string) ($row['begin'] ?? '');
        $end = $row['end'] ?? null;
        if ($begin !== '' && $asOf < $begin) {
            return false;
        }
        if ($end && $asOf > (string) $end) {
            return false;
        }

        $lastSent = $row['last_sent'] ?? null;
        $monthly = max(0, (int) ($row['monthly'] ?? 0));
        $days = max(0, (int) ($row['days'] ?? 0));

        if (! $lastSent) {
            return $begin !== '' && $asOf >= $begin;
        }

        $next = new \DateTimeImmutable((string) $lastSent);
        if ($monthly > 0) {
            $next = $next->modify("+{$monthly} months");
        }
        if ($days > 0) {
            $next = $next->modify("+{$days} days");
        }

        return $asOf >= $next->format('Y-m-d');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function dueList(?string $asOfDate = null): array
    {
        if (! Schema::hasTable('recurrent_invoices')) {
            return [];
        }

        $asOf = $asOfDate ?? now()->toDateString();

        return DB::table('recurrent_invoices')
            ->where('begin', '<=', $asOf)
            ->where(function ($q) use ($asOf) {
                $q->whereNull('end')->orWhere('end', '>=', $asOf);
            })
            ->orderBy('description')
            ->get()
            ->map(fn ($row) => (array) $row)
            ->all();
    }
}
