<?php

namespace App\Services\Accounting;

/**
 * Ensures module transactions in a date range have gl_trans rows before financial reports run.
 */
class ReportGlSyncService
{
    public function __construct(private PostingsService $postings)
    {
    }

    /**
     * Backfill missing GL for transactions in the report date range.
     *
     * @param  array<string, mixed>  $filters
     * @return array{posted: int, skipped: int, errors: array<int, string>}|null
     */
    public function syncBeforeReport(array $filters, bool $enabled = true): ?array
    {
        if (! $enabled) {
            return null;
        }

        [$fromDate, $toDate] = $this->resolveDateRange($filters);
        if ($fromDate === null && $toDate === null) {
            return null;
        }

        return $this->postings->backfillAllMissingGl($fromDate, $toDate);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: ?string, 1: ?string}
     */
    public function resolveDateRange(array $filters): array
    {
        $fromDate = trim((string) ($filters['fromDate'] ?? ''));
        $toDate = trim((string) ($filters['toDate'] ?? ''));
        $asAtDate = trim((string) ($filters['asAtDate'] ?? ''));

        if ($fromDate === '' && $asAtDate !== '') {
            $fromDate = $asAtDate;
            $toDate = $asAtDate;
        }

        return [
            $fromDate !== '' ? $fromDate : null,
            $toDate !== '' ? $toDate : null,
        ];
    }
}
