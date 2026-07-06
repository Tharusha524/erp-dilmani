<?php

namespace App\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuditTrailRecorder
{
    public static function record(
        int $transType,
        int $transNo,
        string $glDate,
        string $description,
        ?int $glSeq = null
    ): void {
        if (! Schema::hasTable('audit_trail')) {
            return;
        }

        $range = ActiveFiscalYear::range($glDate);
        $row = [
            'type' => $transType,
            'trans_no' => $transNo,
            'user' => (int) (Auth::id() ?? 0),
            'description' => substr($description, 0, 60),
            'fiscal_year' => (int) ($range['id'] ?? 0),
            'gl_date' => $glDate,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('audit_trail', 'gl_seq')) {
            $row['gl_seq'] = $glSeq ?? self::nextGlSeq($transType, $transNo);
        }

        DB::table('audit_trail')->insert($row);
    }

    public static function markVoided(int $transType, int $transNo, string $voidDate, ?string $memo = null): void
    {
        if (Schema::hasTable('audit_trail') && Schema::hasColumn('audit_trail', 'gl_seq')) {
            DB::table('audit_trail')
                ->where('type', $transType)
                ->where('trans_no', $transNo)
                ->update(['gl_seq' => 0, 'updated_at' => now()]);
        }

        $desc = $memo ? "VOID: {$memo}" : 'VOID';
        self::record($transType, $transNo, $voidDate, $desc, 0);
    }

    private static function nextGlSeq(int $transType, int $transNo): int
    {
        if (! Schema::hasTable('audit_trail') || ! Schema::hasColumn('audit_trail', 'gl_seq')) {
            return 1;
        }

        $max = (int) DB::table('audit_trail')
            ->where('type', $transType)
            ->where('trans_no', $transNo)
            ->max('gl_seq');

        return max(1, $max + 1);
    }
}
