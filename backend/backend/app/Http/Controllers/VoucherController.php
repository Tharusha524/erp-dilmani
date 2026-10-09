<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use App\Models\VoucherRedemption;
use App\Services\Banking\BankingTransactionService;
use App\Services\Sales\SalesInvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class VoucherController extends Controller
{
    /** The "Gift Voucher" catalog item — see migration 2026_09_09_000000. */
    private const VOUCHER_ITEM_ID = 'GIFTVOUCHER';

    /** Liability account credited when a voucher is issued, debited when redeemed. */
    private const VOUCHERS_PAYABLE_ACCOUNT = '2155';

    /** This system's live Sales revenue account (see chart_master — not the seeder's example code). */
    private const SALES_ACCOUNT = '2000';

    public function __construct(
        private SalesInvoiceService $invoiceService,
        private BankingTransactionService $bankingService,
    ) {}

    public function index()
    {
        return response()->json(Voucher::with('debtor:debtor_no,name')->orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'debtor_no' => 'nullable|exists:debtors_master,debtor_no',
            'face_value' => 'required|numeric|min:1',
            'expiry_date' => 'nullable|date',
            'note' => 'nullable|string',
            // Optional — when supplied together, the voucher sale is posted
            // as a real invoice (Dr Cash/Debtor, Cr Vouchers Payable)
            // instead of just being recorded as a bare row.
            'branch_code' => 'nullable|integer|exists:cust_branch,branch_code',
            'bank_account_id' => 'nullable|integer|exists:bank_accounts,id',
        ]);

        $data['voucher_code'] = 'GV-' . strtoupper(Str::random(10));
        $data['balance'] = $data['face_value'];
        $data['issue_date'] = now()->toDateString();
        $data['status'] = 'active';

        $canPostSale = !empty($data['debtor_no']) && !empty($data['branch_code']) && !empty($data['bank_account_id']);

        if (!$canPostSale) {
            // Legacy path — unchanged behaviour for callers that don't yet
            // send a branch/payment method (e.g. the current Issue Voucher
            // screen). The voucher works exactly as before; it just isn't
            // linked to an accounting entry.
            unset($data['branch_code'], $data['bank_account_id']);
            return response()->json(Voucher::create($data)->load('debtor:debtor_no,name'), 201);
        }

        try {
            return DB::transaction(function () use ($data) {
                $invoiceResult = $this->invoiceService->directInvoice([
                    'debtor_no' => $data['debtor_no'],
                    'branch_code' => $data['branch_code'],
                    'order_type' => $this->defaultSalesTypeId(),
                    'cash_sale' => true,
                    'bank_account_id' => $data['bank_account_id'],
                    'tran_date' => $data['issue_date'],
                    'ship_via' => $this->defaultShipViaId(),
                    'from_stk_loc' => $this->defaultStockLocation(),
                    'reference' => 'Gift voucher ' . $data['voucher_code'],
                    'comments' => $data['note'] ?? 'Gift voucher issued',
                    'lines' => [[
                        'stock_id' => self::VOUCHER_ITEM_ID,
                        'quantity' => 1,
                        'unit_price' => $data['face_value'],
                    ]],
                ]);

                unset($data['branch_code'], $data['bank_account_id']);
                $data['issued_debtor_trans_no'] = $invoiceResult['trans_no'] ?? null;
                $data['issued_debtor_trans_type'] = $invoiceResult['trans_type'] ?? SalesInvoiceService::TYPE_INVOICE;

                $voucher = Voucher::create($data)->load('debtor:debtor_no,name');

                return response()->json([
                    'voucher' => $voucher,
                    'invoice' => $invoiceResult,
                ], 201);
            });
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['message' => 'Failed to post the voucher sale to accounting: ' . $e->getMessage()], 500);
        }
    }

    public function show(string $code)
    {
        $voucher = Voucher::where('voucher_code', $code)->first();
        if (!$voucher) {
            return response()->json(['message' => 'Voucher not found'], 404);
        }
        return response()->json($voucher);
    }

    /**
     * Redeem part or all of a voucher's balance toward a sale.
     *
     * The POS checkout folds a voucher into the invoice's own line prices
     * as a discount *before* posting it — by the time this runs, that
     * invoice is already fully paid in cash for its (already-discounted)
     * total, so there is no outstanding balance to "pay off" here. What
     * actually happened economically is: the shop gave away goods worth
     * more than it charged for, funded by a liability it already banked
     * when the voucher was sold. So this posts a journal entry — Debit
     * Vouchers Payable, Credit Sales, for the redeemed amount — recognising
     * that revenue and drawing down the liability. It never touches the
     * invoice or the debtor's balance.
     */
    public function redeem(Request $request)
    {
        $data = $request->validate([
            'voucher_code' => 'required|exists:vouchers,voucher_code',
            'amount' => 'required|numeric|min:0.01',
            'debtor_trans_no' => 'nullable|integer',
            'debtor_trans_type' => 'nullable|integer',
        ]);

        $voucher = Voucher::where('voucher_code', $data['voucher_code'])->first();

        if ($voucher->status !== 'active') {
            return response()->json(['message' => 'This voucher is not active'], 422);
        }
        if ($voucher->expiry_date && now()->toDateString() > $voucher->expiry_date) {
            return response()->json(['message' => 'This voucher has expired'], 422);
        }
        if ($voucher->balance < $data['amount']) {
            return response()->json(['message' => 'Insufficient voucher balance'], 422);
        }

        try {
            return DB::transaction(function () use ($voucher, $data) {
                $voucher->balance -= $data['amount'];
                if ($voucher->balance <= 0.001) {
                    $voucher->status = 'redeemed';
                }
                $voucher->save();

                $journalTransNo = $this->postRedemptionJournal($voucher, $data);

                $redemption = VoucherRedemption::create([
                    'voucher_id' => $voucher->id,
                    'debtor_trans_no' => $data['debtor_trans_no'] ?? null,
                    'debtor_trans_type' => $data['debtor_trans_type'] ?? null,
                    'amount_used' => $data['amount'],
                    'payment_trans_no' => $journalTransNo,
                    'redeemed_at' => now()->toDateString(),
                ]);

                return response()->json(['voucher' => $voucher, 'redemption' => $redemption], 201);
            });
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['message' => 'Failed to post the voucher redemption to accounting: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Posts Dr Vouchers Payable / Cr Sales for the redeemed amount, as a
     * plain journal entry via the same posting path the Banking module
     * uses for any manual journal. Returns null (no posting, legacy
     * behaviour) if the required accounts aren't set up in this environment.
     */
    private function postRedemptionJournal(Voucher $voucher, array $data): ?int
    {
        $hasAccounts = DB::table('chart_master')
            ->whereIn('account_code', [self::VOUCHERS_PAYABLE_ACCOUNT, self::SALES_ACCOUNT])
            ->count() === 2;
        if (!$hasAccounts) {
            return null;
        }

        $result = $this->bankingService->postJournal([
            'tran_date' => now()->toDateString(),
            'reference' => 'Voucher redemption ' . $data['voucher_code'],
            'memo' => "Voucher {$data['voucher_code']} redeemed for " . number_format((float) $data['amount'], 2),
            'lines' => [
                ['account_code' => self::VOUCHERS_PAYABLE_ACCOUNT, 'debit' => $data['amount'], 'credit' => 0, 'memo' => 'Voucher redeemed'],
                ['account_code' => self::SALES_ACCOUNT, 'debit' => 0, 'credit' => $data['amount'], 'memo' => 'Voucher redeemed'],
            ],
        ]);

        return (int) ($result['trans_no'] ?? 0) ?: null;
    }

    private function defaultSalesTypeId(): int
    {
        return (int) (
            DB::table('sales_types')->where('typeName', 'Retail')->value('id')
            ?? DB::table('sales_types')->where('status', 'active')->orderBy('id')->value('id')
            ?? 1
        );
    }

    private function defaultShipViaId(): ?int
    {
        return DB::table('shipping_companies')->orderBy('shipper_id')->value('shipper_id');
    }

    /**
     * The voucher item never actually moves stock (it's a Service-flag
     * item), but the sales order/delivery pipeline still requires a valid
     * location code structurally — any active location works.
     */
    private function defaultStockLocation(): ?string
    {
        return DB::table('inventory_locations')->orderBy('loc_code')->value('loc_code');
    }
}
