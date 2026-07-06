<?php

namespace App\Http\Controllers;

use App\Services\Banking\BankBalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BankBalanceController extends Controller
{
    public function __construct(private BankBalanceService $bankBalanceService)
    {
    }

    /** GET /api/bank-balances — all active accounts with book balance */
    public function index(Request $request): JsonResponse
    {
        $asAt = $request->query('as_at');

        return response()->json([
            'as_at' => $asAt ?? now()->toDateString(),
            'total' => $this->bankBalanceService->getTotalBalance($asAt),
            'accounts' => $this->bankBalanceService->getAllBalances($asAt),
        ]);
    }

    /** GET /api/bank-accounts/{id}/balance */
    public function show(Request $request, string $id): JsonResponse
    {
        $bankId = (int) $id;
        $asAt = $request->query('as_at');

        $account = DB::table('bank_accounts')->where('id', $bankId)->first();
        if (! $account) {
            return response()->json(['message' => 'Bank account not found'], 404);
        }

        $bookBalance = $this->bankBalanceService->getBalance($bankId, $asAt);
        $glBalance = $account->account_gl_code
            ? $this->bankBalanceService->getGlBalance($account->account_gl_code, $asAt)
            : null;

        return response()->json([
            'bank_account_id' => $bankId,
            'bank_account_name' => $account->bank_account_name,
            'account_gl_code' => $account->account_gl_code,
            'as_at' => $asAt ?? now()->toDateString(),
            'book_balance' => $bookBalance,
            'ending_reconcile_balance' => (float) ($account->ending_reconcile_balance ?? 0),
            'last_reconciled_date' => $account->last_reconciled_date,
            'gl_balance' => $glBalance,
        ]);
    }
}
