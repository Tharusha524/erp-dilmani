<?php

namespace App\Services\Accounting;

use App\Exceptions\GlPostingException;
use App\Models\DebtorTrans;
use App\Models\SuppTrans;
use App\Services\FixedAssets\FaDepreciationService;
use App\Support\CustomerExchangeRate;
use App\Support\GlAccountResolver;
use App\Support\GlTransHelper;
use App\Support\SalesKitExploder;
use App\Support\SalesLinePricing;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PostingsService
{
    /** Memo prefixes for module-specific GL extensions that must survive standard repost. */
    private const FA_DISPOSAL_MEMO = 'FA disposal';

    private const FA_PURCHASE_MEMO = 'FA purchase';

    public function postDebtorInvoice(DebtorTrans $debtorTrans): void
    {
        $transType = (int) ($debtorTrans->trans_type ?? 10);
        $typeNo = (int) ($debtorTrans->trans_no ?? 0);
        $rate = $this->documentRate($debtorTrans);
        $arAmount = $this->debtorInvoiceReceivableAmount($debtorTrans, $transType, $typeNo);
        if (abs($arAmount) < 0.001 || $typeNo === 0) {
            return;
        }

        $receivable = $this->pref('receivableAccount');

        if (! $receivable) {
            throw new GlPostingException('Set receivableAccount in System Preferences before posting sales invoices.');
        }

        $tranDate = $debtorTrans->tran_date ?? now();
        $reference = $debtorTrans->reference ?? ('INV-'.$typeNo);

        $lines = [];
        $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $receivable, $arAmount, 0, 'Invoice AR', $debtorTrans->cost_center_id, $rate);

        $this->appendDebtorRevenueLines($lines, $debtorTrans, $transType, $typeNo, $reference, $tranDate, false);

        // FrontAccounting: COGS/inventory is posted on delivery (13), not on sales invoice (10).
        $this->insertBalancedLines($lines, 'Sales invoice GL is not balanced. Check tax, freight, and discount accounts in System Preferences.');
    }

    public function postDebtorCreditNote(DebtorTrans $debtorTrans): void
    {
        $transType = (int) ($debtorTrans->trans_type ?? 11);
        $typeNo = (int) ($debtorTrans->trans_no ?? 0);
        $rate = $this->documentRate($debtorTrans);
        $arAmount = abs($this->debtorInvoiceReceivableAmount($debtorTrans, $transType, $typeNo));
        if ($arAmount < 0.001 || $typeNo === 0) {
            return;
        }

        $receivable = $this->pref('receivableAccount');
        if (! $receivable) {
            throw new GlPostingException('Set receivableAccount in System Preferences before posting credit notes.');
        }

        $tranDate = $debtorTrans->tran_date ?? now();
        $reference = $debtorTrans->reference ?? ('CN-'.$typeNo);

        $inventoryAccount = $this->pref('inventoryAccount');
        $cogsAccount = $this->pref('cogsAccount');
        $writeOffAccount = trim((string) ($debtorTrans->write_off_account ?? ''));

        $lines = [];
        $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $receivable, 0, $arAmount, 'Credit note AR', $debtorTrans->cost_center_id, $rate);

        $this->appendDebtorRevenueLines($lines, $debtorTrans, $transType, $typeNo, $reference, $tranDate, true);

        $details = DB::table('debtor_trans_details')
            ->where('debtor_trans_no', $typeNo)
            ->where('debtor_trans_type', $transType)
            ->get();

        foreach ($details as $d) {
            $stockLines = SalesKitExploder::stockLines((string) ($d->stock_id ?? ''), (float) ($d->quantity ?? 0));
            foreach ($stockLines as $stockLine) {
                $unitCost = $this->resolveStockUnitCost((string) $stockLine['stock_id']);
                if ($unitCost <= 0.001) {
                    $unitCost = (float) ($d->standard_cost ?? 0);
                }
                $cogsAmount = round($stockLine['quantity'] * $unitCost, 2);
                if ($cogsAmount <= 0) {
                    continue;
                }

                $itemAccounts = $this->stockItemAccounts($stockLine['stock_id']);
                $lineCogs = $this->resolveItemCogsAccount($itemAccounts, $cogsAccount);

                if ($writeOffAccount !== '') {
                    if ($lineCogs) {
                        $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $writeOffAccount, $cogsAmount, 0, 'Write-off '.$stockLine['stock_id'], $debtorTrans->cost_center_id, $rate);
                        $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $lineCogs, 0, $cogsAmount, 'Write-off COGS '.$stockLine['stock_id'], $debtorTrans->cost_center_id, $rate);
                    }

                    continue;
                }

                $lineInventory = $itemAccounts['inventory'] ?? $inventoryAccount;
                if ($lineCogs && $lineInventory) {
                    $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $lineInventory, $cogsAmount, 0, 'Reverse inventory '.$stockLine['stock_id'], $debtorTrans->cost_center_id, $rate);
                    $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $lineCogs, 0, $cogsAmount, 'Reverse COGS '.$stockLine['stock_id'], $debtorTrans->cost_center_id, $rate);
                }
            }
        }

        $this->insertBalancedLines($lines, 'Credit note GL is not balanced. Check tax, freight, and discount accounts.');
    }

    /**
     * Post bank_trans to GL — customer/supplier payments and deposits.
     */
    public function postBankPayment($bankTrans): void
    {
        $this->repostBankPayment($bankTrans);
    }

    /**
     * Rebuild bank_trans GL (delete existing lines first).
     */
    public function repostBankPayment($bankTrans): void
    {
        $transType = (int) ($bankTrans->type ?? 0);
        $typeNo = (int) ($bankTrans->trans_no ?? 0);
        if ($typeNo <= 0) {
            return;
        }

        // Itemised payments/deposits (expense lines, loan liability, etc.) are posted by BankingTransactionService.
        if (in_array($transType, [1, 2], true)) {
            return;
        }

        GlTransHelper::deletePosted($transType, $typeNo);
        $this->buildBankPaymentGl($bankTrans);
    }

    /**
     * Remove all GL lines for a posted module transaction.
     *
     * @param  array<int, string>  $preserveMemoPrefixes
     */
    public function deletePostedGl(int $transType, int $typeNo, array $preserveMemoPrefixes = []): void
    {
        if ($typeNo <= 0) {
            return;
        }

        if ($preserveMemoPrefixes !== []) {
            GlTransHelper::deletePostedExceptMemoPrefixes($transType, $typeNo, $preserveMemoPrefixes);
        } else {
            GlTransHelper::deletePosted($transType, $typeNo);
        }
    }

    private function buildBankPaymentGl($bankTrans): void
    {
        $amount = (float) ($bankTrans->amount ?? 0);
        if (abs($amount) < 0.001) {
            return;
        }

        $transType = (int) ($bankTrans->type ?? 0);
        $typeNo = (int) ($bankTrans->trans_no ?? 0);
        if ($typeNo <= 0) {
            return;
        }

        $bankGl = $this->resolveBankGlCode($bankTrans->bank_act ?? null);
        $receivable = $this->pref('receivableAccount');
        $payable = $this->pref('payableAccount');

        $tranDate = $bankTrans->trans_date ?? now();
        $reference = (string) ($bankTrans->ref ?? ('BANK-'.$typeNo));

        $lines = [];
        $absAmount = abs($amount);
        $documentRate = 1.0;
        $debtor = null;
        $supp = null;

        if ($transType === 12) {
            $debtor = DebtorTrans::query()
                ->where('trans_type', 12)
                ->where('trans_no', $typeNo)
                ->first();
            $documentRate = $debtor ? $this->documentRate($debtor) : 1.0;
        } elseif ($transType === 22) {
            $supp = SuppTrans::query()
                ->where('trans_type', 22)
                ->where('trans_no', $typeNo)
                ->first();
            $documentRate = $supp ? $this->supplierDocumentRate($supp) : 1.0;
        }

        if ($bankGl) {
            $lines[] = $this->line(
                $transType,
                $typeNo,
                $reference,
                $tranDate,
                $bankGl,
                $amount > 0 ? $absAmount : 0,
                $amount < 0 ? $absAmount : 0,
                'Bank movement',
                null,
                $documentRate
            );
        }

        // Customer payment (12): Dr Bank / Dr Discount / Dr Bank charge / Cr AR (FrontAccounting)
        if ($transType === 12 && $receivable && $debtor) {
            $paymentAmount = round((float) ($debtor->ov_amount ?? $absAmount), 2);
            $discount = round(abs((float) ($debtor->ov_discount ?? 0)), 2);
            $bankCharge = round(max(0, $paymentAmount - $absAmount), 2);
            $arCredit = round($paymentAmount + $discount, 2);
            $rate = $documentRate;

            $lines[] = $this->line(
                $transType,
                $typeNo,
                $reference,
                $tranDate,
                $receivable,
                0,
                $arCredit,
                'Customer payment',
                $debtor->cost_center_id ?? null,
                $rate
            );

            if ($discount > 0.001) {
                $discountAccount = $this->resolveCustomerPaymentDiscountAccount((int) ($debtor->branch_code ?? 0));
                if ($discountAccount) {
                    $lines[] = $this->line(
                        $transType,
                        $typeNo,
                        $reference,
                        $tranDate,
                        $discountAccount,
                        $discount,
                        0,
                        'Payment discount',
                        $debtor->cost_center_id ?? null,
                        $rate
                    );
                }
            }

            if ($bankCharge > 0.001) {
                $chargeAccount = $this->resolveBankChargeAccount((int) ($bankTrans->bank_act ?? 0));
                if ($chargeAccount) {
                    $lines[] = $this->line(
                        $transType,
                        $typeNo,
                        $reference,
                        $tranDate,
                        $chargeAccount,
                        $bankCharge,
                        0,
                        'Bank charge',
                        $debtor->cost_center_id ?? null,
                        $rate
                    );
                }
            }
        }
        // Supplier payment (22): Dr AP / Dr Discount / Cr Bank (FrontAccounting)
        elseif ($transType === 22 && $payable && $supp) {
            $paymentAmount = round(abs((float) ($supp->ov_amount ?? $absAmount)), 2);
            $discount = round(abs((float) ($supp->ov_discount ?? 0)), 2);
            $bankCharge = round(max(0, $paymentAmount - $absAmount), 2);
            $apDebit = round($paymentAmount + $discount, 2);
            $rate = $documentRate;

            $lines[] = $this->line(
                $transType,
                $typeNo,
                $reference,
                $tranDate,
                $payable,
                $apDebit,
                0,
                'Supplier payment',
                null,
                $rate
            );

            if ($discount > 0.001) {
                $discountAccount = $this->resolveSupplierPaymentDiscountAccount((int) ($supp->supplier_id ?? 0));
                if ($discountAccount) {
                    $lines[] = $this->line(
                        $transType,
                        $typeNo,
                        $reference,
                        $tranDate,
                        $discountAccount,
                        $discount,
                        0,
                        'Supplier payment discount',
                        null,
                        $rate
                    );
                }
            }

            if ($bankCharge > 0.001) {
                $chargeAccount = $this->resolveBankChargeAccount((int) ($bankTrans->bank_act ?? 0));
                if ($chargeAccount) {
                    $lines[] = $this->line(
                        $transType,
                        $typeNo,
                        $reference,
                        $tranDate,
                        $chargeAccount,
                        $bankCharge,
                        0,
                        'Bank charge',
                        null,
                        $rate
                    );
                }
            }
        }
        // Bank deposit (2): Dr Bank / Cr AR
        elseif ($transType === 2 && $receivable && $amount > 0) {
            $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $receivable, 0, $absAmount, 'Bank deposit');
        }

        if (count($lines) < 2) {
            throw new GlPostingException('Bank GL could not be posted. Check bank account GL code and receivable/payable accounts in System Preferences.');
        }

        $this->insertBalancedLines($lines, 'Bank payment GL is not balanced.');
    }

    private function resolveCustomerPaymentDiscountAccount(int $branchCode): ?string
    {
        if ($branchCode > 0 && Schema::hasTable('cust_branch')) {
            $branchDiscount = trim((string) (DB::table('cust_branch')
                ->where('branch_code', $branchCode)
                ->value('payment_discount_account') ?? ''));
            if ($branchDiscount !== '') {
                return $branchDiscount;
            }
        }

        return $this->resolvedPref('promptPaymentDiscountAccount');
    }

    private function resolveSupplierPaymentDiscountAccount(int $supplierId): ?string
    {
        if ($supplierId > 0 && Schema::hasTable('suppliers')) {
            $supplierDiscount = trim((string) (DB::table('suppliers')
                ->where('supplier_id', $supplierId)
                ->value('payment_discount_account') ?? ''));
            if ($supplierDiscount !== '') {
                return $supplierDiscount;
            }
        }

        return $this->resolvedPref('promptPaymentDiscountAccount');
    }

    private function resolveBankChargeAccount(int $bankAccountId): ?string
    {
        if ($bankAccountId > 0 && Schema::hasTable('bank_accounts')) {
            $bankCharge = trim((string) (DB::table('bank_accounts')
                ->where('id', $bankAccountId)
                ->value('bank_charges_act') ?? ''));
            if ($bankCharge !== '') {
                return $bankCharge;
            }
        }

        return $this->resolvedPref('bankChargesAccount');
    }

    private function documentRate(DebtorTrans $debtorTrans): float
    {
        $rate = (float) ($debtorTrans->rate ?? 0);

        return $rate > 0.000001 ? $rate : 1.0;
    }

    private function supplierDocumentRate(SuppTrans $suppTrans): float
    {
        return $this->exchangeRateFromRow($suppTrans);
    }

    private function exchangeRateFromRow(object $row): float
    {
        $rate = (float) ($row->rate ?? 0);

        return $rate > 0.000001 ? $rate : 1.0;
    }

    public function postSuppInvoice($suppTrans): void
    {
        $this->repostSuppTrans($suppTrans);
    }

    /**
     * Rebuild supplier GL (invoice / credit note) — preserves FA purchase extension lines.
     */
    public function repostSuppTrans($suppTransRow): void
    {
        $transType = (int) ($suppTransRow->trans_type ?? 20);
        $typeNo = (int) ($suppTransRow->trans_no ?? 0);
        if ($typeNo <= 0) {
            return;
        }

        if ($transType === 20) {
            GlTransHelper::deletePostedExceptMemoPrefixes($transType, $typeNo, [self::FA_PURCHASE_MEMO]);
            $this->buildSuppInvoiceGl($suppTransRow);
        } elseif ($transType === 21) {
            GlTransHelper::deletePosted($transType, $typeNo);
            $this->buildSuppCreditNoteGl($suppTransRow);
        }
    }

    private function buildSuppInvoiceGl($suppTrans): void
    {
        $transType = (int) ($suppTrans->trans_type ?? 20);
        $typeNo = (int) ($suppTrans->trans_no ?? 0);
        $headerTotal = abs((float) ($suppTrans->ov_amount ?? 0) + (float) ($suppTrans->ov_gst ?? 0));
        if ($headerTotal < 0.001 || $typeNo === 0) {
            return;
        }

        $payable = $this->pref('payableAccount');
        $purchase = $this->pref('purchaseAccount') ?? $this->pref('cogsAccount');
        $clearing = $this->resolvedPref('grnClearingAccount');

        $tranDate = $suppTrans->trans_date ?? now();
        $reference = $suppTrans->reference ?? ('AP-'.$typeNo);
        $rate = $this->exchangeRateFromRow($suppTrans);

        $lines = [];
        $items = Schema::hasTable('supp_invoice_items')
            ? DB::table('supp_invoice_items')
                ->where('supp_trans_no', $typeNo)
                ->where('supp_trans_type', $transType)
                ->get()
            : collect();

        if ($items->isNotEmpty()) {
            $clearingTotal = 0.0;
            $expenseTotal = 0.0;
            $lineTaxTotal = 0.0;

            foreach ($items as $item) {
                $netAmount = round(
                    ((float) ($item->quantity ?? 0)) * ((float) ($item->unit_price ?? 0)),
                    2
                );
                $lineTax = round(
                    ((float) ($item->quantity ?? 0)) * ((float) ($item->unit_tax ?? 0)),
                    2
                );
                $lineTaxTotal += $lineTax;

                if ($netAmount < 0.001 && $lineTax < 0.001) {
                    continue;
                }

                if (! empty($item->grn_item_id) && $clearing) {
                    $clearingTotal += $netAmount;
                } elseif ($netAmount >= 0.001) {
                    $account = trim((string) ($item->gl_code ?? '')) ?: ($purchase ?? '');
                    if ($account === '') {
                        continue;
                    }
                    $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $account, $netAmount, 0, 'Supplier invoice '.($item->stock_id ?? ''), null, $rate);
                    $expenseTotal += $netAmount;
                }
            }

            if ($clearingTotal > 0.001 && $clearing) {
                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $clearing, $clearingTotal, 0, 'Clear GRN clearing', null, $rate);
            }

            $headerTax = round((float) ($suppTrans->ov_gst ?? 0), 2);
            $taxToPost = $headerTax > 0.001 ? $headerTax : $lineTaxTotal;
            if ($taxToPost > 0.001) {
                $this->appendPurchaseTaxLines($lines, $transType, $typeNo, $reference, $tranDate, $taxToPost, false, $rate);
            }

            $apAmount = $headerTotal > 0.001 ? $headerTotal : round($clearingTotal + $expenseTotal + $taxToPost, 2);
            $postedDebits = $clearingTotal + $expenseTotal + $taxToPost;
            if ($apAmount > $postedDebits + 0.01 && $purchase) {
                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $purchase, round($apAmount - $postedDebits, 2), 0, 'Supplier invoice', null, $rate);
            }
        } else {
            $netAmount = round((float) ($suppTrans->ov_amount ?? 0), 2);
            $headerTax = round((float) ($suppTrans->ov_gst ?? 0), 2);

            if ($purchase && $netAmount > 0.001) {
                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $purchase, $netAmount, 0, 'Supplier invoice', null, $rate);
            }
            if ($headerTax > 0.001) {
                $this->appendPurchaseTaxLines($lines, $transType, $typeNo, $reference, $tranDate, $headerTax, false, $rate);
            }
            $apAmount = $headerTotal;
        }

        if (! $payable) {
            throw new GlPostingException('Set payableAccount in System Preferences before posting supplier invoices.');
        }

        if ($payable && ($apAmount ?? $headerTotal) > 0.001) {
            $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $payable, 0, $apAmount ?? $headerTotal, 'Accounts payable', null, $rate);
        }

        $tradeDiscount = abs(round((float) ($suppTrans->ov_discount ?? 0), 2));
        $lineDiscount = $this->purchaseLineDiscountTotal($typeNo, $transType);
        $totalDiscount = round($tradeDiscount + $lineDiscount, 2);
        $discountAccount = $this->resolvedPref('purchaseDiscountAccount');
        if ($totalDiscount > 0.001 && $discountAccount) {
            $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $discountAccount, 0, $totalDiscount, 'Purchase discount', null, $rate);
        }

        $this->insertBalancedLines($lines, 'Supplier invoice GL is not balanced. Check purchase, tax, and payable accounts.');
    }

    private function buildSuppCreditNoteGl($suppTrans): void
    {
        $transType = (int) ($suppTrans->trans_type ?? 21);
        $typeNo = (int) ($suppTrans->trans_no ?? 0);
        $headerTotal = abs((float) ($suppTrans->ov_amount ?? 0) + (float) ($suppTrans->ov_gst ?? 0));
        if ($headerTotal < 0.001 || $typeNo === 0) {
            return;
        }

        $payable = $this->pref('payableAccount');
        $purchase = $this->pref('purchaseAccount') ?? $this->pref('cogsAccount');
        $clearing = $this->resolvedPref('grnClearingAccount');

        if (! $payable) {
            throw new GlPostingException('Set payableAccount in System Preferences before posting supplier credit notes.');
        }

        $tranDate = $suppTrans->trans_date ?? now();
        $reference = $suppTrans->reference ?? ('AP-CN-'.$typeNo);
        $rate = $this->exchangeRateFromRow($suppTrans);

        $lines = [];
        $items = Schema::hasTable('supp_invoice_items')
            ? DB::table('supp_invoice_items')
                ->where('supp_trans_no', $typeNo)
                ->where('supp_trans_type', $transType)
                ->get()
            : collect();

        if ($items->isNotEmpty()) {
            $clearingTotal = 0.0;
            $expenseTotal = 0.0;
            $lineTaxTotal = 0.0;

            foreach ($items as $item) {
                $netAmount = round(
                    ((float) ($item->quantity ?? 0)) * ((float) ($item->unit_price ?? 0)),
                    2
                );
                if ($netAmount < 0.001 && empty($item->grn_item_id) && trim((string) ($item->gl_code ?? '')) !== '' && (string) ($item->gl_code ?? '') !== '0') {
                    $netAmount = round((float) ($item->unit_price ?? 0), 2);
                }
                $lineTax = round(
                    ((float) ($item->quantity ?? 0)) * ((float) ($item->unit_tax ?? 0)),
                    2
                );
                $lineTaxTotal += $lineTax;

                if ($netAmount < 0.001 && $lineTax < 0.001) {
                    continue;
                }

                if (! empty($item->grn_item_id) && $clearing) {
                    $clearingTotal += $netAmount;
                } elseif ($netAmount >= 0.001) {
                    $account = trim((string) ($item->gl_code ?? '')) ?: ($purchase ?? '');
                    if ($account === '' || $account === '0') {
                        continue;
                    }
                    $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $account, 0, $netAmount, 'Supplier credit '.($item->stock_id ?? $account), null, $rate);
                    $expenseTotal += $netAmount;
                }
            }

            if ($clearingTotal > 0.001 && $clearing) {
                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $clearing, 0, $clearingTotal, 'Reverse GRN clearing', null, $rate);
            }

            $headerTax = round(abs((float) ($suppTrans->ov_gst ?? 0)), 2);
            $taxToPost = $headerTax > 0.001 ? $headerTax : $lineTaxTotal;
            if ($taxToPost > 0.001) {
                $this->appendPurchaseTaxLines($lines, $transType, $typeNo, $reference, $tranDate, $taxToPost, true, $rate);
            }

            $apAmount = $headerTotal > 0.001 ? $headerTotal : round($clearingTotal + $expenseTotal + $taxToPost, 2);
            $postedCredits = $clearingTotal + $expenseTotal + $taxToPost;
            if ($apAmount > $postedCredits + 0.01 && $purchase) {
                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $purchase, 0, round($apAmount - $postedCredits, 2), 'Supplier credit note', null, $rate);
            }
        } else {
            $netAmount = round(abs((float) ($suppTrans->ov_amount ?? 0)), 2);
            $taxAmount = round(abs((float) ($suppTrans->ov_gst ?? 0)), 2);

            if ($clearing && $netAmount > 0.001) {
                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $clearing, 0, $netAmount, 'Reverse GRN clearing', null, $rate);
            } elseif ($purchase && $netAmount > 0.001) {
                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $purchase, 0, $netAmount, 'Supplier credit note', null, $rate);
            }

            if ($taxAmount > 0.001) {
                $this->appendPurchaseTaxLines($lines, $transType, $typeNo, $reference, $tranDate, $taxAmount, true, $rate);
            }

            $apAmount = $headerTotal;
        }

        $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $payable, $apAmount ?? $headerTotal, 0, 'Reverse accounts payable', null, $rate);

        $this->insertBalancedLines($lines, 'Supplier credit note GL is not balanced.');
    }

    /**
     * Create missing gl_trans from supp_trans / bank_trans when GL Postings is opened.
     */
    public function ensurePurchaseGlPosted(int $transType, int $transNo, ?string $reference = null): void
    {
        if ($transNo > 0 && $transType === 20) {
            $row = DB::table('supp_trans')
                ->where('trans_type', 20)
                ->where('trans_no', $transNo)
                ->first();
            if ($row) {
                $this->repostSuppTrans($row);
            }
        }

        if ($transNo > 0 && $transType === 21) {
            $row = DB::table('supp_trans')
                ->where('trans_type', 21)
                ->where('trans_no', $transNo)
                ->first();
            if ($row) {
                $this->repostSuppTrans($row);
            }
        }

        if ($transNo > 0 && $transType === 25) {
            $this->postGrnBatch($transNo);
        }

        if ($transNo > 0 && $transType === 22) {
            $this->postSupplierPaymentBySuppTransNo($transNo, $reference);

            return;
        }

        $ref = trim((string) ($reference ?? ''));
        if ($ref === '') {
            return;
        }

        // When a specific purchase document was requested, do not repost every row sharing the reference.
        if ($transNo > 0 && in_array($transType, [20, 21, 25], true)) {
            return;
        }

        $suppRows = DB::table('supp_trans')
            ->where('reference', $ref)
            ->get();
        foreach ($suppRows as $row) {
            $rowType = (int) ($row->trans_type ?? 0);
            if ($rowType === 20) {
                $this->repostSuppTrans($row);
            } elseif ($rowType === 21) {
                $this->repostSuppTrans($row);
            } elseif ($rowType === 22) {
                $this->postSupplierPaymentBySuppTransNo((int) ($row->trans_no ?? 0), $ref);
            }
        }

        if ($transType === 25 && $transNo > 0) {
            $this->postGrnBatch($transNo);
        }

        $grnBatch = DB::table('grn_batch')
            ->where('reference', $ref)
            ->first();
        if ($grnBatch) {
            $this->postGrnBatch((int) $grnBatch->id);
        }

        $bankRows = DB::table('bank_trans')
            ->where('type', 22)
            ->where('ref', $ref)
            ->get();
        foreach ($bankRows as $row) {
            $this->postBankPayment($row);
        }
    }

    private function postSupplierPaymentBySuppTransNo(int $transNo, ?string $reference = null): void
    {
        if ($transNo <= 0) {
            return;
        }

        $bank = DB::table('bank_trans')
            ->where('type', 22)
            ->where('trans_no', $transNo)
            ->first();

        if (! $bank) {
            $supp = DB::table('supp_trans')
                ->where('trans_type', 22)
                ->where('trans_no', $transNo)
                ->first();

            if ($supp) {
                $ref = trim((string) ($supp->reference ?? $reference ?? ''));
                $payAmount = abs((float) ($supp->ov_amount ?? 0));
                $tranDate = $supp->tran_date ?? null;

                $query = DB::table('bank_trans')->where('type', 22);
                if ($ref !== '') {
                    $query->where('ref', $ref);
                }
                if ($tranDate) {
                    $query->whereDate('trans_date', $tranDate);
                }

                $bank = $query->get()->first(
                    fn ($row) => abs(abs((float) ($row->amount ?? 0)) - $payAmount) < 0.01
                ) ?? $query->orderByDesc('trans_no')->first();
            }
        }

        if ($bank) {
            $this->postBankPayment($bank);
        }
    }

    public function ensureBankGlPosted(int $transType, int $transNo, ?string $reference = null): void
    {
        if ($transNo > 0 && GlTransHelper::alreadyPosted($transType, $transNo)) {
            return;
        }

        $row = null;
        if ($transNo > 0) {
            $row = DB::table('bank_trans')
                ->where('type', $transType)
                ->where('trans_no', $transNo)
                ->first();
        }

        if (! $row && $reference !== null && $reference !== '') {
            $row = DB::table('bank_trans')
                ->where('ref', $reference)
                ->when($transType > 0, fn ($q) => $q->where('type', $transType))
                ->first();
        }

        if ($row) {
            if (GlTransHelper::alreadyPosted((int) $row->type, (int) $row->trans_no)) {
                return;
            }
            $this->buildBankPaymentGl($row);
        }
    }

    public function postSuppCreditNote($suppTrans): void
    {
        $this->repostSuppTrans($suppTrans);
    }

    /**
     * Backfill GL for sales invoices/credit notes (types 10, 11).
     */
    public function ensureDebtorGlPosted(int $transType, int $transNo, ?string $reference = null): void
    {
        if ($transNo > 0 && in_array($transType, [10, 11, 13], true)) {
            $row = DB::table('debtor_trans')
                ->where('trans_type', $transType)
                ->where('trans_no', $transNo)
                ->first();
            if ($row) {
                $this->repostDebtorTrans($row);

                return;
            }
        }

        if ($transNo > 0 && $transType === 12) {
            $this->ensureBankGlPosted(12, $transNo, $reference);

            return;
        }

        $ref = trim((string) ($reference ?? ''));
        if ($ref === '') {
            return;
        }

        if ($transNo > 0 && in_array($transType, [10, 11, 12, 13], true)) {
            return;
        }

        $rows = DB::table('debtor_trans')
            ->where('reference', $ref)
            ->when($transType > 0, fn ($q) => $q->where('trans_type', $transType))
            ->get();

        foreach ($rows as $row) {
            $this->repostDebtorTrans($row);
        }
    }

    /**
     * Backfill GL for a direct sales invoice bundle (invoice, cash receipt, delivery on same order).
     */
    public function ensureSalesOrderGlPosted(int $orderNo, ?string $reference = null): void
    {
        if ($orderNo <= 0) {
            return;
        }

        $invoiceRef = trim((string) ($reference ?? ''));

        if (Schema::hasTable('debtor_trans')) {
            $onOrder = DB::table('debtor_trans')
                ->where('order_no', $orderNo)
                ->get(['trans_type', 'trans_no', 'reference']);

            foreach ($onOrder as $row) {
                $type = (int) $row->trans_type;
                if ($type === 10) {
                    if ($invoiceRef === '') {
                        $invoiceRef = trim((string) ($row->reference ?? ''));
                    }
                    $this->repostDebtorTrans($row);
                }
            }
        }

        if ($invoiceRef === '') {
            return;
        }

        if (Schema::hasTable('bank_trans')) {
            $bankRows = DB::table('bank_trans')
                ->where('type', 12)
                ->where('ref', $invoiceRef)
                ->get();

            foreach ($bankRows as $bank) {
                $this->repostBankPayment($bank);
            }
        }
    }

    /**
     * Backfill GL for a purchase order bundle (GRN, supplier invoice, supplier payment).
     */
    public function ensurePurchaseOrderGlPosted(int $purchOrderNo, ?string $reference = null): void
    {
        if ($purchOrderNo <= 0) {
            return;
        }

        $docRef = trim((string) ($reference ?? ''));

        if (Schema::hasTable('grn_batch')) {
            $grns = DB::table('grn_batch')
                ->where('purch_order_no', $purchOrderNo)
                ->get(['id', 'reference']);

            foreach ($grns as $grn) {
                if ($docRef === '' && trim((string) ($grn->reference ?? '')) !== '') {
                    $docRef = trim((string) $grn->reference);
                }
                $this->postGrnBatch((int) $grn->id);
            }
        }

        if ($docRef === '') {
            return;
        }

        if (Schema::hasTable('supp_trans')) {
            $suppRows = DB::table('supp_trans')->where('reference', $docRef)->get();
            foreach ($suppRows as $row) {
                $type = (int) ($row->trans_type ?? 0);
                if (in_array($type, [20, 21], true)) {
                    $this->repostSuppTrans($row);
                } elseif ($type === 22) {
                    $this->postSupplierPaymentBySuppTransNo((int) ($row->trans_no ?? 0), $docRef);
                }
            }
        }

        if (Schema::hasTable('bank_trans')) {
            $bankRows = DB::table('bank_trans')->where('type', 22)->where('ref', $docRef)->get();
            foreach ($bankRows as $bank) {
                $this->repostBankPayment($bank);
            }
        }
    }

    /**
     * Backfill GL for manufacturing work order documents sharing one reference.
     */
    public function ensureWorkOrderGlPosted(string $reference): void
    {
        $ref = trim($reference);
        if ($ref === '') {
            return;
        }

        $this->postWoIssueByReference($ref);
        $this->postWoManufactureByReference($ref);
        $this->postWoCostJournalByReference($ref);
        $this->postWoCloseByReference($ref);
    }

    /**
     * Backfill GL for fixed asset purchase, sale, disposal, or related documents.
     */
    public function ensureFixedAssetsGlPosted(
        ?string $reference = null,
        ?int $transType = null,
        ?int $transNo = null
    ): void {
        $ref = trim((string) ($reference ?? ''));
        $type = (int) ($transType ?? 0);
        $no = (int) ($transNo ?? 0);

        if ($type === 20 && $no > 0 && Schema::hasTable('supp_trans')) {
            $row = DB::table('supp_trans')->where('trans_type', 20)->where('trans_no', $no)->first();
            if ($row) {
                $this->repostSuppTrans($row);
            }
        }

        if ($type === 13 && $no > 0 && Schema::hasTable('debtor_trans')) {
            $row = DB::table('debtor_trans')->where('trans_type', 13)->where('trans_no', $no)->first();
            if ($row) {
                $this->repostDebtorTrans($row);
            }
        }

        if ($type === 10 && $no > 0 && Schema::hasTable('debtor_trans')) {
            $row = DB::table('debtor_trans')->where('trans_type', 10)->where('trans_no', $no)->first();
            if ($row) {
                $this->repostDebtorTrans($row);
            }
        }

        if ($type === 17 && $no > 0 && Schema::hasTable('stock_moves')) {
            $move = DB::table('stock_moves')->where('type', 17)->where('trans_no', $no)->first();
            if ($move) {
                $this->repostStockMove($move);
            }
        }

        if ($ref === '') {
            return;
        }

        if ($type <= 0 || $no <= 0) {
            $this->ensurePurchaseGlPosted(0, 0, $ref);
            $this->ensureDebtorGlPosted(0, 0, $ref);
            $this->ensureInventoryAdjustmentPosted(0, $ref);
        }
    }

    /**
     * Rebuild debtor GL after invoice lines (COGS) are added or changed.
     */
    public function repostDebtorTrans($debtorTransRow): void
    {
        $transType = (int) ($debtorTransRow->trans_type ?? 10);
        $typeNo = (int) ($debtorTransRow->trans_no ?? 0);
        if ($typeNo <= 0) {
            return;
        }

        GlTransHelper::deletePostedExceptMemoPrefixes($transType, $typeNo, [self::FA_DISPOSAL_MEMO]);

        $model = DebtorTrans::query()
            ->where('trans_type', $transType)
            ->where('trans_no', $typeNo)
            ->first();

        if (! $model) {
            return;
        }

        if ($transType === 11) {
            $this->postDebtorCreditNote($model);
        } elseif ($transType === 10) {
            $this->postDebtorInvoice($model);
        } elseif ($transType === 13) {
            $this->postDebtorDelivery($model);
        }
    }

    /**
     * Delivery note (type 13) — COGS/inventory; prepaid revenue; fixed-asset disposal (FrontAccounting).
     */
    public function postDebtorDelivery(DebtorTrans $debtorTrans): void
    {
        $transType = (int) ($debtorTrans->trans_type ?? 13);
        $typeNo = (int) ($debtorTrans->trans_no ?? 0);
        if ($typeNo <= 0 || $transType !== 13) {
            return;
        }

        $inventoryAccount = $this->pref('inventoryAccount');
        $cogsAccount = $this->pref('cogsAccount');
        if (! $inventoryAccount || ! $cogsAccount) {
            throw new GlPostingException('Set inventoryAccount and cogsAccount in System Preferences before posting deliveries.');
        }

        $tranDate = $debtorTrans->tran_date ?? now();
        $reference = $debtorTrans->reference ?? ('DN-'.$typeNo);
        $debtorNo = (int) ($debtorTrans->debtor_no ?? 0);
        $customerDim = $this->customerCostCenter($debtorNo);

        $details = DB::table('debtor_trans_details')
            ->where('debtor_trans_no', $typeNo)
            ->where('debtor_trans_type', $transType)
            ->get();

        $lines = [];
        $prepaidTotal = 0.0;
        $isPrepaid = (float) ($debtorTrans->prep_amount ?? 0) > 0.001;
        $rate = $this->documentRate($debtorTrans);

        foreach ($details as $d) {
            $lineQty = abs((float) ($d->quantity ?? 0));
            if ($lineQty < 0.001) {
                continue;
            }

            $stockLines = SalesKitExploder::stockLines((string) ($d->stock_id ?? ''), $lineQty);
            $isFirstComponent = true;

            foreach ($stockLines as $stockLine) {
                $qty = (float) $stockLine['quantity'];
                if ($qty < 0.001) {
                    continue;
                }

                $stockId = (string) $stockLine['stock_id'];
                $itemAccounts = $this->stockItemAccounts($stockId);
                if (! $itemAccounts || (int) ($itemAccounts['mb_flag'] ?? 0) === 3) {
                    continue;
                }

                $unitCost = $this->resolveStockUnitCost($stockId);
                if ($unitCost <= 0.001) {
                    $unitCost = $this->resolveDebtorDetailUnitCost($d);
                }

                $dim = $this->resolveLineCostCenter(
                    (int) ($debtorTrans->cost_center_id ?? 0),
                    $customerDim,
                    (int) ($itemAccounts['mb_flag'] ?? 0)
                );

                if ((int) ($itemAccounts['mb_flag'] ?? 0) === FaDepreciationService::FA_MB_FLAG) {
                    $faPurchase = (float) (DB::table('stock_master')->where('stock_id', $stockId)->value('purchase_cost') ?? 0);
                    if ($faPurchase <= 0.001) {
                        $faPurchase = (float) (DB::table('stock_master')->where('stock_id', $stockId)->value('material_cost') ?? 0);
                    }

                    $qohAfter = $this->stockQuantityOnHand($stockId);
                    $qohBefore = max($qty, $qohAfter + $qty);
                    $grossForLine = round(($faPurchase / max($qohBefore, 1)) * $qty, 2);
                    $bookForLine = round($unitCost * $qty, 2);
                    $faDepreciation = max(0, round($grossForLine - $bookForLine, 2));
                    $adjustment = $itemAccounts['adjustment'] ?: $cogsAccount;
                    $lineInventory = $itemAccounts['inventory'] ?? $inventoryAccount;
                    $lineCogs = $this->resolveItemCogsAccount($itemAccounts, $cogsAccount);

                    if ($faDepreciation > 0.001) {
                        $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $adjustment, $faDepreciation, 0, 'FA depreciation '.$stockId, $dim, $rate);
                    }
                    if ($grossForLine > 0.001) {
                        $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $lineInventory, 0, $grossForLine, 'FA asset '.$stockId, $dim, $rate);
                    }
                    if ($bookForLine > 0.001) {
                        $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $lineCogs, $bookForLine, 0, 'FA COGS '.$stockId, $dim, $rate);
                    }

                    continue;
                }

                $cogsAmount = round($qty * $unitCost, 2);
                if ($cogsAmount < 0.001) {
                    continue;
                }

                $lineCogs = $this->resolveItemCogsAccount($itemAccounts, $cogsAccount);
                $lineInventory = $itemAccounts['inventory'] ?? $inventoryAccount;

                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $lineCogs, $cogsAmount, 0, 'COGS '.$stockId, $dim, $rate);
                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $lineInventory, 0, $cogsAmount, 'Inventory '.$stockId, $dim, $rate);

                if ($isPrepaid && $isFirstComponent) {
                    $lineNet = round(
                        $lineQty * (float) ($d->unit_price ?? 0) * (1 - (float) ($d->discount_percent ?? 0) / 100),
                        2
                    );
                    $parentAccounts = $this->stockItemAccounts((string) ($d->stock_id ?? '')) ?? $itemAccounts;
                    $salesAccount = $this->branchSalesAccount((int) ($debtorTrans->branch_code ?? 0), $parentAccounts);
                    if ($salesAccount && $lineNet > 0.001) {
                        $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $salesAccount, 0, $lineNet, 'Prepaid sales '.$d->stock_id, $dim, $rate);
                        $prepaidTotal += $lineNet;
                    }
                }

                $isFirstComponent = false;
            }
        }

        if ($isPrepaid && $prepaidTotal > 0.001) {
            $deferred = GlAccountResolver::resolve('deferredIncomeAccount', $this->pref('deferredIncomeAccount'));
            if ($deferred) {
                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $deferred, $prepaidTotal, 0, 'Deferred income', $debtorTrans->cost_center_id, $rate);
            }
        }

        if ($lines === []) {
            return;
        }

        $this->insertBalancedLines($lines, 'Delivery GL is not balanced. Check COGS and inventory accounts.');
    }

    private function customerCostCenter(int $debtorNo): int
    {
        if ($debtorNo <= 0) {
            return 0;
        }

        return (int) (DB::table('debtors_master')->where('debtor_no', $debtorNo)->value('cost_center_id') ?? 0);
    }

    private function resolveLineCostCenter(int $docCostCenter, int $customerCostCenter, int $mbFlag): int
    {
        if ($docCostCenter > 0 && $docCostCenter !== $customerCostCenter) {
            return $docCostCenter;
        }

        return $customerCostCenter > 0 ? $customerCostCenter : 0;
    }

    /**
     * @param  array<string, mixed>  $itemAccounts
     */
    private function branchSalesAccount(int $branchCode, array $itemAccounts): ?string
    {
        if ($branchCode > 0 && Schema::hasTable('cust_branch')) {
            $branchSales = trim((string) (DB::table('cust_branch')->where('branch_code', $branchCode)->value('sales_account') ?? ''));
            if ($branchSales !== '') {
                return $branchSales;
            }
        }

        $itemSales = trim((string) ($itemAccounts['sales'] ?? ''));

        return $itemSales !== '' ? $itemSales : $this->pref('salesAccount');
    }

    /**
     * @param  object|array<string, mixed>  $detail
     */
    private function resolveDebtorDetailUnitCost(object|array $detail): float
    {
        $d = is_array($detail) ? (object) $detail : $detail;
        $std = (float) ($d->standard_cost ?? 0);
        if ($std > 0.001) {
            return $std;
        }

        $stockId = trim((string) ($d->stock_id ?? ''));
        if ($stockId !== '' && Schema::hasTable('stock_master')) {
            $row = DB::table('stock_master')->where('stock_id', $stockId)->first();
            if ($row) {
                $purchase = (float) ($row->purchase_cost ?? 0);
                if ($purchase > 0.001 && Schema::hasTable('fa_depreciation_lines')) {
                    $accum = (float) DB::table('fa_depreciation_lines')->where('stock_id', $stockId)->sum('amount');
                    $qoh = $this->stockQuantityOnHand($stockId);
                    if ($qoh > 0.001) {
                        return max(0, round(($purchase - $accum) / $qoh, 4));
                    }

                    return max(0, round($purchase - $accum, 4));
                }

                $material = (float) ($row->material_cost ?? 0);
                if ($material > 0.001) {
                    return $material;
                }
            }
        }

        return (float) ($d->unit_price ?? 0);
    }

    private function stockQuantityOnHand(string $stockId): float
    {
        if ($stockId === '' || ! Schema::hasTable('stock_moves')) {
            return 0;
        }

        $stockColumn = Schema::hasColumn('stock_moves', 'stock_id') ? 'stock_id' : 'item_code';
        $qtyColumn = Schema::hasColumn('stock_moves', 'qty') ? 'qty' : 'quantity';

        return (float) DB::table('stock_moves')->where($stockColumn, $stockId)->sum($qtyColumn);
    }

    /**
     * Inventory adjustment stock move (type 17) — Dr/Cr inventory vs adjustment account from item setup.
     */
    public function postStockMove($move): void
    {
        $transType = (int) (is_object($move) ? ($move->type ?? 17) : ($move['type'] ?? 17));
        $typeNo = (int) (is_object($move) ? ($move->trans_no ?? 0) : ($move['trans_no'] ?? 0));
        if ($transType === 17 && $typeNo > 0) {
            $this->repostInventoryAdjustmentTransaction($typeNo);

            return;
        }

        $this->repostStockMove($move);
    }

    /**
     * Repost GL for an entire inventory adjustment transaction (all lines).
     * FrontAccounting posts one Dr/Cr pair per item under the same trans_no.
     */
    public function repostInventoryAdjustmentTransaction(int $transNo): void
    {
        $transType = 17;
        if ($transNo <= 0 || ! Schema::hasTable('stock_moves')) {
            return;
        }

        GlTransHelper::deletePostedExceptMemoPrefixes($transType, $transNo, [self::FA_DISPOSAL_MEMO]);

        $moves = DB::table('stock_moves')
            ->where('type', $transType)
            ->where('trans_no', $transNo)
            ->orderBy('trans_id')
            ->get();

        $allLines = [];
        foreach ($moves as $move) {
            $lines = $this->buildInventoryAdjustmentGlLines($move);
            if ($lines !== []) {
                array_push($allLines, ...$lines);
            }
        }

        if ($allLines === []) {
            return;
        }

        $this->insertBalancedLines($allLines, 'Inventory adjustment GL is not balanced.');
    }

    public function repostStockMove($move): void
    {
        $transType = (int) ($move->type ?? 17);
        if ($transType !== 17) {
            return;
        }

        $typeNo = (int) ($move->trans_no ?? 0);
        if ($typeNo <= 0) {
            return;
        }

        $this->repostInventoryAdjustmentTransaction($typeNo);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildInventoryAdjustmentGlLines(object $move): array
    {
        $transType = 17;
        $typeNo = (int) ($move->trans_no ?? 0);
        $stockId = trim((string) ($move->stock_id ?? ''));
        $accounts = $this->stockItemAccounts($stockId);
        if (! $accounts || (int) ($accounts['mb_flag'] ?? 0) === FaDepreciationService::FA_MB_FLAG) {
            return [];
        }

        $qty = (float) ($move->qty ?? 0);
        $unitCost = (float) ($move->standard_cost ?? 0);
        if ($unitCost <= 0) {
            $unitCost = $accounts['standard_cost'];
        }
        $amount = round(abs($qty) * $unitCost, 2);
        if ($amount < 0.001) {
            return [];
        }

        $inventory = $accounts['inventory'];
        $adjustment = $accounts['adjustment'] ?: $this->resolvedPref('inventoryAdjustmentsAccount');
        if (! $inventory || ! $adjustment) {
            throw new GlPostingException('Stock item needs inventory and adjustment accounts before posting inventory adjustments.');
        }

        $reference = (string) ($move->reference ?? 'ADJ-'.$typeNo);
        $tranDate = $move->tran_date ?? now();

        if ($qty > 0) {
            return [
                $this->line($transType, $typeNo, $reference, $tranDate, $inventory, $amount, 0, 'Inventory adjustment in '.$stockId),
                $this->line($transType, $typeNo, $reference, $tranDate, $adjustment, 0, $amount, 'Inventory adjustment offset '.$stockId),
            ];
        }

        return [
            $this->line($transType, $typeNo, $reference, $tranDate, $adjustment, $amount, 0, 'Inventory adjustment out '.$stockId),
            $this->line($transType, $typeNo, $reference, $tranDate, $inventory, 0, $amount, 'Inventory adjustment offset '.$stockId),
        ];
    }
    public function postGrnBatch(int $grnBatchId): void
    {
        if ($grnBatchId <= 0 || ! Schema::hasTable('grn_batch')) {
            return;
        }

        $transType = 25;
        GlTransHelper::deletePosted($transType, $grnBatchId);

        $batch = DB::table('grn_batch')->where('id', $grnBatchId)->first();
        if (! $batch || ! Schema::hasTable('grn_items')) {
            return;
        }

        $items = DB::table('grn_items')->where('grn_batch_id', $grnBatchId)->get();
        if ($items->isEmpty()) {
            return;
        }

        $clearing = $this->resolvedPref('grnClearingAccount')
            ?? $this->resolvedPref('purchaseAccount')
            ?? $this->resolvedPref('payableAccount');
        if (! $clearing) {
            throw new GlPostingException('Set grnClearingAccount in System Preferences before posting GRN.');
        }

        $reference = (string) ($batch->reference ?? 'GRN-'.$grnBatchId);
        $tranDate = $batch->delivery_date ?? now();
        $rate = $this->exchangeRateFromRow($batch);
        $lines = [];

        foreach ($items as $item) {
            $accounts = $this->stockItemAccounts((string) ($item->item_code ?? ''));
            if (! $accounts || ! $accounts['inventory']) {
                continue;
            }

            $qty = (float) ($item->qty_recd ?? 0);
            $unitCost = $this->resolveGrnItemUnitCost($grnBatchId, $item, $accounts);
            $amount = round($qty * $unitCost, 2);
            if ($amount < 0.001) {
                continue;
            }

            $lines[] = $this->line($transType, $grnBatchId, $reference, $tranDate, $accounts['inventory'], $amount, 0, 'GRN receipt '.($item->item_code ?? ''), null, $rate);
            $lines[] = $this->line($transType, $grnBatchId, $reference, $tranDate, $clearing, 0, $amount, 'GRN clearing '.($item->item_code ?? ''), null, $rate);
        }

        if ($lines === []) {
            return;
        }

        $this->insertBalancedLines($lines, 'GRN receipt GL is not balanced. Check item inventory accounts and GRN clearing account.');
    }
    public function postWoIssue(int $issueNo): void
    {
        if ($issueNo <= 0 || ! Schema::hasTable('wo_issues')) {
            return;
        }

        $transType = 28;
        GlTransHelper::deletePosted($transType, $issueNo);

        $issue = DB::table('wo_issues')->where('issue_no', $issueNo)->first();
        if (! $issue || ! Schema::hasTable('workorders')) {
            return;
        }

        $workOrder = DB::table('workorders')->where('id', $issue->workorder_id)->first();
        if (! $workOrder) {
            return;
        }

        $finished = $this->stockItemAccounts((string) ($workOrder->stock_id ?? ''));
        if (! $finished || ! $finished['wip']) {
            throw new GlPostingException('Finished item on the work order needs a WIP account configured in Stock Master.');
        }

        $items = Schema::hasTable('wo_issue_items')
            ? DB::table('wo_issue_items')->where('issue_id', $issueNo)->get()
            : collect();

        if ($items->isEmpty()) {
            return;
        }

        $reference = (string) ($issue->reference ?? 'WO-ISSUE-'.$issueNo);
        $tranDate = $issue->issue_date ?? now();
        $lines = [];

        foreach ($items as $item) {
            $component = $this->stockItemAccounts((string) ($item->stock_id ?? ''));
            $creditAccount = $this->componentConsumptionAccount($component);
            if (! $component || ! $creditAccount) {
                continue;
            }

            $qty = abs((float) ($item->qty_issued ?? 0));
            $unitCost = (float) ($item->unit_cost ?? 0);
            if ($unitCost <= 0) {
                $unitCost = $component['standard_cost'];
            }
            $amount = round($qty * $unitCost, 2);
            if ($amount < 0.001) {
                continue;
            }

            $lines[] = $this->line($transType, $issueNo, $reference, $tranDate, $finished['wip'], $amount, 0, 'WIP issue '.($item->stock_id ?? ''));
            $lines[] = $this->line($transType, $issueNo, $reference, $tranDate, $creditAccount, 0, $amount, 'Component issue '.($item->stock_id ?? ''));
        }

        if ($lines === []) {
            return;
        }

        $this->insertBalancedLines($lines, 'Work order issue GL is not balanced. Check WIP and component inventory accounts.');
    }

    /**
     * Work order production receive (type 29) — consume BOM components: Dr WIP / Cr inventory (or COGS for services).
     *
     * @param  array<int, array{stock_id:string, amount:float, memo?:string}>  $components
     */
    public function postWoManufacture(int $manufactureId, array $components = []): void
    {
        if ($manufactureId <= 0 || ! Schema::hasTable('wo_manufacture')) {
            return;
        }

        if ($components === []) {
            $components = $this->resolveProductionComponentsFromManufacture($manufactureId);
        }

        $reverse = $this->isUnassembleManufacture($manufactureId);
        $this->postWoProductionReceive($manufactureId, $components, $reverse);
    }

    private function isUnassembleManufacture(int $manufactureId): bool
    {
        if (! Schema::hasTable('workorders')) {
            return false;
        }

        $manufacture = DB::table('wo_manufacture')->where('id', $manufactureId)->first();
        if (! $manufacture) {
            return false;
        }

        $wo = DB::table('workorders')->where('id', $manufacture->workorder_id)->first();

        return $wo && (int) ($wo->type ?? 0) === 1;
    }

    private function isUnassembleWorkOrder(int $workOrderId): bool
    {
        if ($workOrderId <= 0 || ! Schema::hasTable('workorders')) {
            return false;
        }

        return (int) DB::table('workorders')->where('id', $workOrderId)->value('type') === 1;
    }

    /**
     * @param  array<int, array{stock_id:string, amount:float, memo?:string}>  $components
     * @param  bool  $reverse  Unassemble — Dr component inventory / Cr WIP (FA negative production qty).
     */
    public function postWoProductionReceive(int $manufactureId, array $components, bool $reverse = false): void
    {
        if ($manufactureId <= 0 || $components === []) {
            return;
        }

        $transType = 29;
        GlTransHelper::deletePosted($transType, $manufactureId);

        $manufacture = DB::table('wo_manufacture')->where('id', $manufactureId)->first();
        if (! $manufacture || ! Schema::hasTable('workorders')) {
            return;
        }

        $workOrder = DB::table('workorders')->where('id', $manufacture->workorder_id)->first();
        if (! $workOrder) {
            return;
        }

        $finished = $this->stockItemAccounts((string) ($workOrder->stock_id ?? ''));
        if (! $finished || ! $finished['wip']) {
            throw new GlPostingException('Finished item on the work order needs a WIP account in Stock Master.');
        }

        $reference = (string) ($manufacture->reference ?? 'WO-PROD-'.$manufactureId);
        $tranDate = $manufacture->date ?? now();
        $lines = [];
        $wipTotal = 0.0;

        foreach ($components as $component) {
            $stockId = (string) ($component['stock_id'] ?? '');
            $amount = round((float) ($component['amount'] ?? 0), 2);
            if ($stockId === '' || $amount < 0.001) {
                continue;
            }

            $accounts = $this->stockItemAccounts($stockId);
            $componentAccount = $this->componentConsumptionAccount($accounts);
            if (! $componentAccount) {
                continue;
            }

            $memo = (string) ($component['memo'] ?? 'Component consumption '.$stockId);
            if ($reverse) {
                $lines[] = $this->line($transType, $manufactureId, $reference, $tranDate, $componentAccount, $amount, 0, $memo);
            } else {
                $lines[] = $this->line($transType, $manufactureId, $reference, $tranDate, $componentAccount, 0, $amount, $memo);
            }
            $wipTotal += $amount;
        }

        if ($wipTotal < 0.001) {
            return;
        }

        $wipMemo = 'WIP production '.($workOrder->stock_id ?? '');
        if ($reverse) {
            $lines[] = $this->line($transType, $manufactureId, $reference, $tranDate, $finished['wip'], 0, $wipTotal, $wipMemo);
        } else {
            $lines[] = $this->line($transType, $manufactureId, $reference, $tranDate, $finished['wip'], $wipTotal, 0, $wipMemo);
        }

        $this->insertBalancedLines($lines, 'Work order production GL is not balanced. Check component and WIP accounts.');
    }

    /**
     * Close work order (type 26) — Dr finished inventory / Cr WIP at actual accumulated cost.
     *
     * @param  bool  $reverse  Unassemble — Cr finished inventory / Dr WIP.
     */
    public function postWoClose(int $workOrderId, ?string $reference = null, $tranDate = null, ?string $memo = null, bool $reverse = false): void
    {
        if ($workOrderId <= 0 || ! Schema::hasTable('workorders')) {
            return;
        }

        $transType = 26;
        GlTransHelper::deletePosted($transType, $workOrderId);

        $workOrder = DB::table('workorders')->where('id', $workOrderId)->first();
        if (! $workOrder) {
            return;
        }

        $finished = $this->stockItemAccounts((string) ($workOrder->stock_id ?? ''));
        if (! $finished || ! $finished['inventory'] || ! $finished['wip']) {
            throw new GlPostingException('Finished item needs inventory and WIP accounts in Stock Master.');
        }

        $totalCost = round($this->computeWorkOrderTotalCost($workOrderId), 2);
        if ($totalCost < 0.001) {
            return;
        }

        $reference = $reference ?? (string) ($workOrder->wo_ref ?? 'WO-'.$workOrderId);
        $tranDate = $tranDate ?? $workOrder->date ?? now();
        $memoText = $memo ?? 'Work order close '.($workOrder->stock_id ?? '');

        if ($reverse) {
            $lines = [
                $this->line($transType, $workOrderId, $reference, $tranDate, $finished['inventory'], 0, $totalCost, $memoText),
                $this->line($transType, $workOrderId, $reference, $tranDate, $finished['wip'], $totalCost, 0, 'Clear WIP on close'),
            ];
        } else {
            $lines = [
                $this->line($transType, $workOrderId, $reference, $tranDate, $finished['inventory'], $totalCost, 0, $memoText),
                $this->line($transType, $workOrderId, $reference, $tranDate, $finished['wip'], 0, $totalCost, 'Clear WIP on close'),
            ];
        }

        $this->insertBalancedLines($lines, 'Work order close GL is not balanced.');
    }

    /**
     * Labour / overhead journal for a work order — Dr WIP / Cr credit account (type 0).
     * WIP line uses finished item cost center (FA add_wo_costs_journal dim1/dim2 on WIP side).
     */
    public function postWoCostJournal(
        int $journalTransNo,
        int $workOrderId,
        float $amount,
        string $creditAccount,
        $tranDate,
        string $reference,
        int $costType = 1
    ): void {
        if ($journalTransNo <= 0 || $workOrderId <= 0 || $amount < 0.001) {
            return;
        }

        $workOrder = DB::table('workorders')->where('id', $workOrderId)->first();
        if (! $workOrder) {
            return;
        }

        $finished = $this->stockItemAccounts((string) ($workOrder->stock_id ?? ''));
        if (! $finished || ! $finished['wip']) {
            throw new GlPostingException('Finished item on the work order needs a WIP account in Stock Master.');
        }

        $creditAccount = trim($creditAccount);
        if ($creditAccount === '') {
            throw new GlPostingException('Credit account is required for work order cost journal.');
        }

        $costCenter = $this->finishedStockCostCenter((string) ($workOrder->stock_id ?? ''));

        $transType = 0;
        GlTransHelper::deletePosted($transType, $journalTransNo);

        $costLabel = $costType === 0 ? 'Labour cost' : 'Overhead cost';
        $lines = [
            $this->line($transType, $journalTransNo, $reference, $tranDate, $finished['wip'], $amount, 0, $costLabel, $costCenter),
            $this->line($transType, $journalTransNo, $reference, $tranDate, $creditAccount, 0, $amount, $costLabel.' credit'),
        ];

        $this->insertBalancedLines($lines, 'Work order cost journal GL is not balanced.');
    }

    /**
     * @return array<int, array<string, mixed>>  GL lines for bank_trans sync (FA is_bank_account on credit).
     */
    public function workOrderCostJournalGlLines(
        int $workOrderId,
        float $amount,
        string $creditAccount,
        int $costType = 1
    ): array {
        $workOrder = DB::table('workorders')->where('id', $workOrderId)->first();
        if (! $workOrder) {
            return [];
        }

        $finished = $this->stockItemAccounts((string) ($workOrder->stock_id ?? ''));
        if (! $finished || ! $finished['wip']) {
            return [];
        }

        $creditAccount = trim($creditAccount);
        if ($creditAccount === '') {
            return [];
        }

        $costCenter = $this->finishedStockCostCenter((string) ($workOrder->stock_id ?? ''));
        $costLabel = $costType === 0 ? 'Labour cost' : 'Overhead cost';

        return [
            ['account' => $finished['wip'], 'debit' => $amount, 'credit' => 0, 'memo' => $costLabel],
            ['account' => $creditAccount, 'debit' => 0, 'credit' => $amount, 'memo' => $costLabel.' credit'],
        ];
    }

    public function computeWorkOrderTotalCost(int $workOrderId): float
    {
        if ($workOrderId <= 0) {
            return 0.0;
        }

        $material = 0.0;
        $labour = 0.0;
        $overhead = 0.0;

        if (Schema::hasTable('wo_requirements')) {
            foreach (DB::table('wo_requirements')->where('workorder_id', $workOrderId)->get() as $req) {
                $unitCost = (float) ($req->unit_cost ?? 0);
                if ($unitCost <= 0) {
                    $unitCost = $this->resolveStockUnitCost(
                        (string) ($req->stock_id ?? ''),
                        (string) ($req->loc_code ?? '')
                    );
                }
                $amount = $unitCost * (float) ($req->units_issued ?? 0);
                if ($this->isServiceMbFlag((int) ($this->stockItemAccounts((string) ($req->stock_id ?? ''))['mb_flag'] ?? 0))) {
                    $labour += $amount;
                } else {
                    $material += $amount;
                }
            }
        }

        if (Schema::hasTable('wo_issue_items') && Schema::hasTable('wo_issues')) {
            $issues = DB::table('wo_issues')->where('workorder_id', $workOrderId)->pluck('issue_no');
            foreach ($issues as $issueNo) {
                foreach (DB::table('wo_issue_items')->where('issue_id', $issueNo)->get() as $item) {
                    $amount = (float) ($item->unit_cost ?? 0) * abs((float) ($item->qty_issued ?? 0));
                    $accounts = $this->stockItemAccounts((string) ($item->stock_id ?? ''));
                    if ($this->isServiceMbFlag((int) ($accounts['mb_flag'] ?? 0))) {
                        $labour += $amount;
                    } else {
                        $material += $amount;
                    }
                }
            }
        }

        if (Schema::hasTable('wo_costing') && Schema::hasTable('journal')) {
            foreach (DB::table('wo_costing')->where('workorder_id', $workOrderId)->get() as $cost) {
                $journal = DB::table('journal')
                    ->where('type', (int) ($cost->trans_type ?? 0))
                    ->where('trans_no', (int) ($cost->trans_no ?? 0))
                    ->first();
                if (! $journal) {
                    continue;
                }
                $amount = abs((float) ($journal->amount ?? 0)) * (float) ($cost->factor ?? 1);
                if ((int) ($cost->cost_type ?? 1) === 0) {
                    $labour += $amount;
                } else {
                    $overhead += $amount;
                }
            }
        }

        return $material + $labour + $overhead;
    }
    public function ensureModuleGlPosted(int $transType, int $transNo, ?string $reference = null): void
    {
        $ref = ($reference !== null && $reference !== '') ? $reference : null;

        if (in_array($transType, [10, 11], true) || ($transType === 0 && $ref !== null)) {
            $this->ensureDebtorGlPosted($transType, $transNo, $ref);
        }
        if (in_array($transType, [20, 21, 22, 25], true) || ($transType === 0 && $ref !== null)) {
            $this->ensurePurchaseGlPosted($transType, $transNo, $ref);
        }
        if (in_array($transType, [1, 2, 4, 12, 22], true) || ($transType === 0 && $ref !== null)) {
            $this->ensureBankGlPosted($transType, $transNo, $ref);
        }
        if ($transType === 17 || ($transType === 0 && $ref !== null)) {
            $this->ensureInventoryAdjustmentPosted($transNo, $ref);
        }
        if ($transType === 28 || ($transType === 0 && $ref !== null && $transNo > 0)) {
            $this->postWoIssue($transNo);
        }
        if ($transType === 29 || ($transType === 0 && $ref !== null && $transNo > 0)) {
            $this->postWoManufacture($transNo);
        }
        if ($transType === 26 || ($transType === 0 && $ref !== null && $transNo > 0)) {
            $wo = Schema::hasTable('workorders') ? DB::table('workorders')->where('id', $transNo)->where('closed', true)->first() : null;
            if ($wo) {
                $this->postWoClose($transNo, $ref);
            }
        }
        if ($transType === 0 && $transNo === 0 && $ref !== null) {
            $this->postWoIssueByReference($ref);
            $this->postWoManufactureByReference($ref);
        }
    }

    /**
     * Backfill GL for transactions that have no gl_trans rows yet.
     *
     * @return array{posted: int, skipped: int, errors: array<int, string>}
     */
    public function backfillAllMissingGl(?string $fromDate = null, ?string $toDate = null): array
    {
        $stats = ['posted' => 0, 'skipped' => 0, 'errors' => []];

        $inRange = function ($query, string $dateColumn) use ($fromDate, $toDate) {
            if ($fromDate) {
                $query->whereDate($dateColumn, '>=', $fromDate);
            }
            if ($toDate) {
                $query->whereDate($dateColumn, '<=', $toDate);
            }
        };

        if (Schema::hasTable('debtor_trans')) {
            $rows = DB::table('debtor_trans')
                ->whereIn('trans_type', [10, 11])
                ->when(true, fn ($q) => $inRange($q, 'tran_date'))
                ->get(['trans_type', 'trans_no']);
            foreach ($rows as $row) {
                $this->backfillOne($stats, (int) $row->trans_type, (int) $row->trans_no, fn () => $this->repostDebtorTrans($row));
            }
        }

        if (Schema::hasTable('supp_trans')) {
            $rows = DB::table('supp_trans')
                ->whereIn('trans_type', [20, 21])
                ->when(true, fn ($q) => $inRange($q, 'trans_date'))
                ->get(['trans_type', 'trans_no']);
            foreach ($rows as $row) {
                $this->backfillOne($stats, (int) $row->trans_type, (int) $row->trans_no, fn () => $this->repostSuppTrans($row));
            }
        }

        if (Schema::hasTable('grn_batch')) {
            $rows = DB::table('grn_batch')
                ->when(true, fn ($q) => $inRange($q, 'delivery_date'))
                ->get(['id']);
            foreach ($rows as $row) {
                $this->backfillOne($stats, 25, (int) $row->id, fn () => $this->postGrnBatch((int) $row->id));
            }
        }

        if (Schema::hasTable('bank_trans')) {
            $rows = DB::table('bank_trans')
                ->whereIn('type', [1, 2, 4, 12, 22])
                ->when(true, fn ($q) => $inRange($q, 'trans_date'))
                ->get(['type', 'trans_no']);
            foreach ($rows as $row) {
                $type = (int) $row->type;
                $no = (int) $row->trans_no;
                // Types 1/2 use multi-line GL from BankingTransactionService — never overwrite via simplified repost.
                if (in_array($type, [1, 2], true)) {
                    $stats['skipped']++;

                    continue;
                }
                $this->backfillOne($stats, $type, $no, fn () => $this->repostBankPayment($row));
            }
        }

        if (Schema::hasTable('stock_moves')) {
            $rows = DB::table('stock_moves')
                ->where('type', 17)
                ->when(true, fn ($q) => $inRange($q, 'tran_date'))
                ->get(['type', 'trans_no', 'stock_id', 'qty', 'standard_cost', 'reference', 'tran_date']);
            foreach ($rows as $row) {
                $this->backfillOne($stats, 17, (int) $row->trans_no, fn () => $this->repostStockMove($row));
            }
        }

        if (Schema::hasTable('wo_issues')) {
            $rows = DB::table('wo_issues')
                ->when(true, fn ($q) => $inRange($q, 'issue_date'))
                ->get(['issue_no']);
            foreach ($rows as $row) {
                $this->backfillOne($stats, 28, (int) $row->issue_no, fn () => $this->postWoIssue((int) $row->issue_no));
            }
        }

        if (Schema::hasTable('wo_manufacture')) {
            $rows = DB::table('wo_manufacture')
                ->when(true, fn ($q) => $inRange($q, 'date'))
                ->get(['id']);
            foreach ($rows as $row) {
                $this->backfillOne($stats, 29, (int) $row->id, fn () => $this->postWoManufacture((int) $row->id));
            }
        }

        return $stats;
    }

    /**
     * @param  array{posted: int, skipped: int, errors: array<int, string>}  $stats
     */
    private function backfillOne(array &$stats, int $transType, int $transNo, callable $post): void
    {
        if ($transNo <= 0) {
            return;
        }

        if (GlTransHelper::alreadyPosted($transType, $transNo)) {
            $stats['skipped']++;

            return;
        }

        try {
            $post();
            if (GlTransHelper::alreadyPosted($transType, $transNo)) {
                $stats['posted']++;
            } else {
                $stats['skipped']++;
            }
        } catch (\Throwable $e) {
            $stats['errors'][] = "type {$transType} no {$transNo}: ".$e->getMessage();
        }
    }

    private function postWoIssueByReference(string $reference): void
    {
        if (! Schema::hasTable('wo_issues')) {
            return;
        }
        $issue = DB::table('wo_issues')
            ->where('reference', $reference)
            ->first();
        if ($issue) {
            $this->postWoIssue((int) $issue->issue_no);
        }
    }

    private function postWoManufactureByReference(string $reference): void
    {
        if (! Schema::hasTable('wo_manufacture')) {
            return;
        }
        $row = DB::table('wo_manufacture')
            ->where('reference', $reference)
            ->first();
        if ($row) {
            $this->postWoManufacture((int) $row->id);
        }
    }

    private function postWoCostJournalByReference(string $reference): void
    {
        if (! Schema::hasTable('wo_costing') || ! Schema::hasTable('journal')) {
            return;
        }

        $costings = DB::table('wo_costing as wc')
            ->join('journal as j', function ($join) {
                $join->on('wc.trans_type', '=', 'j.type')
                    ->on('wc.trans_no', '=', 'j.trans_no');
            })
            ->where('j.reference', $reference)
            ->select('wc.*', 'j.amount', 'j.tran_date', 'j.reference')
            ->get();

        foreach ($costings as $cost) {
            $wo = DB::table('workorders')->where('id', (int) ($cost->workorder_id ?? 0))->first();
            if (! $wo) {
                continue;
            }
            $creditAccount = $this->resolveWoCostCreditAccount((int) ($cost->trans_no ?? 0));
            if ($creditAccount === '') {
                continue;
            }
            $this->postWoCostJournal(
                (int) $cost->trans_no,
                (int) $cost->workorder_id,
                abs((float) ($cost->amount ?? 0)),
                $creditAccount,
                $cost->tran_date ?? now(),
                (string) ($cost->reference ?? $reference),
                (int) ($cost->cost_type ?? 1)
            );
        }
    }

    private function postWoCloseByReference(string $reference): void
    {
        if (! Schema::hasTable('workorders')) {
            return;
        }

        $wo = DB::table('workorders')
            ->where('wo_ref', $reference)
            ->where('closed', true)
            ->first();

        if ($wo) {
            $this->postWoClose((int) $wo->id, $reference, $wo->date ?? now(), null, $this->isUnassembleWorkOrder((int) $wo->id));
        }
    }

    private function resolveWoCostCreditAccount(int $journalTransNo): string
    {
        if ($journalTransNo <= 0 || ! Schema::hasTable('gl_trans')) {
            return '';
        }

        $query = DB::table('gl_trans')->where('type', '0');
        if (Schema::hasColumn('gl_trans', 'type_no')) {
            $query->where('type_no', $journalTransNo);
        }

        $rows = $query->get();
        foreach ($rows as $row) {
            $amount = (float) ($row->amount ?? 0);
            if ($amount < 0 || (Schema::hasColumn('gl_trans', 'credit') && (float) ($row->credit ?? 0) > 0)) {
                return trim((string) ($row->account ?? ''));
            }
        }

        return '';
    }

    /**
     * @return array<int, array{stock_id:string, amount:float, memo?:string}>
     */
    private function resolveProductionComponentsFromManufacture(int $manufactureId): array
    {
        $manufacture = DB::table('wo_manufacture')->where('id', $manufactureId)->first();
        if (! $manufacture) {
            return [];
        }

        $workOrderId = (int) ($manufacture->workorder_id ?? 0);
        $produceQty = abs((float) ($manufacture->quantity ?? 0));
        if ($workOrderId <= 0 || $produceQty < 0.001) {
            return [];
        }

        $workOrder = DB::table('workorders')->where('id', $workOrderId)->first();
        if (! $workOrder) {
            return [];
        }

        $components = [];
        $parentStockId = (string) ($workOrder->stock_id ?? '');

        if (Schema::hasTable('bom') && $parentStockId !== '') {
            foreach (DB::table('bom')->where('parent', $parentStockId)->get() as $bom) {
                $stockId = (string) ($bom->component ?? '');
                $bomQty = (float) ($bom->quantity ?? 0);
                $consumeQty = round($bomQty * $produceQty, 4);
                if ($stockId === '' || $consumeQty < 0.0001) {
                    continue;
                }
                $accounts = $this->stockItemAccounts($stockId);
                $unitCost = $this->resolveStockUnitCost($stockId);
                $components[] = [
                    'stock_id' => $stockId,
                    'amount' => round($consumeQty * $unitCost, 2),
                    'memo' => $consumeQty.' x '.$stockId,
                ];
            }
        }

        if ($components !== []) {
            return $components;
        }

        if (! Schema::hasTable('wo_requirements')) {
            return [];
        }

        $unitsReqd = max(0.0001, (float) ($workOrder->units_reqd ?? 0));
        foreach (DB::table('wo_requirements')->where('workorder_id', $workOrderId)->get() as $req) {
            $stockId = (string) ($req->stock_id ?? '');
            $perParent = (float) ($req->units_req ?? 0);
            if ($perParent <= 0) {
                $perParent = (float) ($req->units_req ?? 0) / $unitsReqd;
            }
            $consumeQty = round($perParent * $produceQty, 4);
            $unitCost = (float) ($req->unit_cost ?? 0);
            if ($unitCost <= 0) {
                $unitCost = $this->resolveStockUnitCost($stockId, (string) ($req->loc_code ?? ''));
            }
            if ($stockId === '' || $consumeQty < 0.0001) {
                continue;
            }
            $components[] = [
                'stock_id' => $stockId,
                'amount' => round($consumeQty * $unitCost, 2),
                'memo' => $consumeQty.' x '.$stockId,
            ];
        }

        return $components;
    }

    /**
     * @param  array{inventory: string, cogs: string, adjustment: string, wip: string, standard_cost: float, mb_flag: int}|null  $accounts
     */
    private function componentConsumptionAccount(?array $accounts): ?string
    {
        if (! $accounts) {
            return null;
        }

        if ($this->isServiceMbFlag((int) ($accounts['mb_flag'] ?? 0))) {
            return ($accounts['cogs'] ?? '') !== '' ? $accounts['cogs'] : null;
        }

        return ($accounts['inventory'] ?? '') !== '' ? $accounts['inventory'] : null;
    }

    private function isServiceMbFlag(int $mbFlag): bool
    {
        return $mbFlag === 3;
    }

    public function ensureInventoryAdjustmentPosted(int $transNo, ?string $reference = null): void
    {
        if ($transNo > 0 && Schema::hasTable('stock_moves')) {
            $move = DB::table('stock_moves')
                ->where('trans_no', $transNo)
                ->where('type', 17)
                ->first();
            if ($move) {
                $this->repostStockMove($move);

                return;
            }
        }

        $ref = trim((string) ($reference ?? ''));
        if ($ref !== '' && Schema::hasTable('stock_moves')) {
            $move = DB::table('stock_moves')
                ->where('type', 17)
                ->where('reference', $ref)
                ->first();
            if ($move) {
                $this->repostStockMove($move);
            }
        }
    }

    private function pref(string $name): ?string
    {
        if (! Schema::hasTable('sys_prefs')) {
            return null;
        }

        $value = DB::table('sys_prefs')->where('name', $name)->value('value');
        $value = $value !== null ? trim((string) $value) : '';

        return $value !== '' ? $value : null;
    }

    private function resolvedPref(string $name): ?string
    {
        return GlAccountResolver::resolve($name, $this->pref($name));
    }

    /**
     * Unit cost for GRN GL — PO-linked receipts use purchase price, not a placeholder material_cost.
     *
     * @param  array{standard_cost: float}  $accounts
     */
    private function resolveGrnItemUnitCost(int $grnBatchId, object $item, array $accounts): float
    {
        $poDetailItem = (int) ($item->po_detail_item ?? 0);
        $po = null;

        if ($poDetailItem > 0 && Schema::hasTable('purch_order_details')) {
            $po = DB::table('purch_order_details')->where('po_detail_item', $poDetailItem)->first();
            if ($po) {
                foreach (
                    [
                        (float) ($po->act_price ?? 0),
                        (float) ($po->unit_price ?? 0),
                    ] as $candidate
                ) {
                    if ($candidate > 0) {
                        return $candidate;
                    }
                }
            }
        }

        if (Schema::hasTable('stock_moves')) {
            $move = DB::table('stock_moves')
                ->where('type', 25)
                ->where('trans_no', $grnBatchId)
                ->where('stock_id', (string) ($item->item_code ?? ''))
                ->orderByDesc('trans_id')
                ->first();

            if ($move) {
                $movePrice = (float) ($move->price ?? 0);
                if ($movePrice > 0) {
                    return $movePrice;
                }
                $moveStd = (float) ($move->standard_cost ?? 0);
                if ($moveStd > 0) {
                    return $moveStd;
                }
            }
        }

        if ($po) {
            $poStd = (float) ($po->std_cost_unit ?? 0);
            if ($poStd > 0) {
                return $poStd;
            }
        }

        return max(0.0, (float) ($accounts['standard_cost'] ?? 0));
    }

    /**
     * Best-effort unit cost for inventory GL (material cost, recent receipt, or purchase cost).
     */
    public function resolveStockUnitCost(string $stockId, ?string $locCode = null): float
    {
        $accounts = $this->stockItemAccounts($stockId);
        if (! $accounts) {
            return 0.0;
        }

        $cost = (float) ($accounts['standard_cost'] ?? 0);
        if ($cost > 0) {
            return $cost;
        }

        if (Schema::hasTable('stock_moves')) {
            $query = DB::table('stock_moves')
                ->where('stock_id', $stockId)
                ->where('qty', '>', 0);

            $loc = trim((string) ($locCode ?? ''));
            if ($loc !== '') {
                $query->where('loc_code', $loc);
            }

            $move = $query->orderByDesc('trans_id')->first();
            if ($move) {
                foreach (['price', 'standard_cost'] as $column) {
                    $value = (float) ($move->{$column} ?? 0);
                    if ($value > 0) {
                        return $value;
                    }
                }
            }
        }

        return 0.0;
    }

    /**
     * @return array{inventory: string, cogs: string, adjustment: string, wip: string, standard_cost: float, mb_flag: int}|null
     */
    /**
     * @param  array<string, mixed>|null  $itemAccounts
     */
    private function resolveItemCogsAccount(?array $itemAccounts, string $defaultCogs): string
    {
        $itemCogs = trim((string) ($itemAccounts['cogs'] ?? ''));
        $resolved = GlAccountResolver::resolve('cogsAccount', $itemCogs !== '' ? $itemCogs : $defaultCogs);

        return $resolved ?: ($defaultCogs !== '' ? $defaultCogs : $itemCogs);
    }

    private function stockItemAccounts(string $stockId): ?array
    {
        if ($stockId === '' || ! Schema::hasTable('stock_master')) {
            return null;
        }

        $row = DB::table('stock_master')->where('stock_id', $stockId)->first();
        if (! $row) {
            return null;
        }

        $standardCost = (float) ($row->material_cost ?? 0);
        if ($standardCost <= 0) {
            $standardCost = (float) ($row->purchase_cost ?? 0);
        }

        return [
            'inventory' => trim((string) ($row->inventory_account ?? '')),
            'cogs' => trim((string) ($row->cogs_account ?? '')),
            'adjustment' => trim((string) ($row->adjustment_account ?? '')),
            'wip' => trim((string) ($row->wip_account ?? '')),
            'sales' => trim((string) ($row->sales_account ?? '')),
            'standard_cost' => $standardCost,
            'mb_flag' => (int) ($row->mb_flag ?? 0),
            'cost_center_id' => (int) ($row->cost_center_id ?? 0),
            'cost_center2_id' => (int) ($row->cost_center2_id ?? 0),
        ];
    }

    private function finishedStockCostCenter(string $stockId): ?int
    {
        $accounts = $this->stockItemAccounts($stockId);
        if (! $accounts) {
            return null;
        }

        $dim = (int) ($accounts['cost_center_id'] ?? 0);

        return $dim > 0 ? $dim : null;
    }

    private function resolveBankGlCode($bankAccountId): ?string
    {
        if ($bankAccountId === null || $bankAccountId === '') {
            return null;
        }

        $code = DB::table('bank_accounts')->where('id', $bankAccountId)->value('account_gl_code');

        return $code ? trim((string) $code) : null;
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     */
    private function isBalanced(array $lines): bool
    {
        $debit = 0.0;
        $credit = 0.0;
        foreach ($lines as $line) {
            $debit += (float) ($line['debit'] ?? 0);
            $credit += (float) ($line['credit'] ?? 0);
        }

        return abs($debit - $credit) < 0.01 && $debit > 0;
    }

    private function debtorTotal(DebtorTrans $debtorTrans): float
    {
        return (float) ($debtorTrans->ov_amount ?? 0)
            + (float) ($debtorTrans->ov_gst ?? 0)
            + (float) ($debtorTrans->ov_freight ?? 0)
            + (float) ($debtorTrans->ov_freight_tax ?? 0)
            + (float) ($debtorTrans->ov_discount ?? 0);
    }

    /**
     * AR/Cash side of a sales invoice — net of line discounts when ov_amount was stored gross.
     */
    private function debtorInvoiceReceivableAmount(DebtorTrans $debtorTrans, int $transType, int $typeNo): float
    {
        $lineDiscount = $this->salesLineDiscountTotal($debtorTrans, $transType, $typeNo);
        $grossFromDetails = $this->salesGrossFromDetails($transType, $typeNo);

        if ($grossFromDetails > 0.001) {
            $netItems = round($grossFromDetails - $lineDiscount, 2);
            $taxAndFreight = round(
                (float) ($debtorTrans->ov_gst ?? 0)
                + (float) ($debtorTrans->ov_freight ?? 0)
                + (float) ($debtorTrans->ov_freight_tax ?? 0)
                + (float) ($debtorTrans->ov_discount ?? 0),
                2
            );

            return round($netItems + $taxAndFreight, 2);
        }

        return round($this->debtorTotal($debtorTrans), 2);
    }

    private function salesGrossFromDetails(int $transType, int $typeNo): float
    {
        $details = DB::table('debtor_trans_details')
            ->where('debtor_trans_no', $typeNo)
            ->where('debtor_trans_type', $transType)
            ->get();

        $gross = 0.0;
        foreach ($details as $detail) {
            $gross += SalesLinePricing::lineGross($detail);
        }

        return round($gross, 2);
    }

    /**
     * Sales revenue split: net sales, output tax, freight, document discount.
     *
     * @param  array<int, array<string, mixed>>  $lines
     */
    private function appendDebtorRevenueLines(
        array &$lines,
        DebtorTrans $debtorTrans,
        int $transType,
        int $typeNo,
        string $reference,
        $tranDate,
        bool $reverse
    ): void {
        $sales = $this->pref('salesAccount');
        $discountAccount = $this->resolvedPref('salesDiscountAccount');
        $shippingAccount = $this->resolvedPref('shippingChargedAccount');
        $rate = $this->documentRate($debtorTrans);

        $netSales = round((float) ($debtorTrans->ov_amount ?? 0), 2);
        $outputTax = round((float) ($debtorTrans->ov_gst ?? 0) + (float) ($debtorTrans->ov_freight_tax ?? 0), 2);
        $freight = round((float) ($debtorTrans->ov_freight ?? 0), 2);
        $documentDiscount = abs(round((float) ($debtorTrans->ov_discount ?? 0), 2));
        $lineDiscount = $this->salesLineDiscountTotal($debtorTrans, $transType, $typeNo);
        $totalDiscount = round($lineDiscount + $documentDiscount, 2);

        $salesByAccount = $this->salesRevenueByAccount($debtorTrans, $transType, $typeNo, $sales);

        if ($reverse) {
            foreach ($salesByAccount as $account => $amount) {
                if ($amount > 0.001 && $account) {
                    $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $account, $amount, 0, 'Reverse sales', $debtorTrans->cost_center_id, $rate);
                }
            }
            if ($totalDiscount > 0.001 && $discountAccount) {
                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $discountAccount, 0, $totalDiscount, 'Reverse sales discount', $debtorTrans->cost_center_id, $rate);
            }
            if ($outputTax > 0.001) {
                $this->appendOutputTaxLines($lines, $transType, $typeNo, $reference, $tranDate, $outputTax, $debtorTrans->cost_center_id, true, $rate);
            }
            if ($freight > 0.001 && $shippingAccount) {
                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $shippingAccount, $freight, 0, 'Reverse freight', $debtorTrans->cost_center_id, $rate);
            }

            return;
        }

        foreach ($salesByAccount as $account => $amount) {
            if ($amount > 0.001 && $account) {
                $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $account, 0, $amount, 'Sales revenue', $debtorTrans->cost_center_id, $rate);
            }
        }
        if ($totalDiscount > 0.001 && $discountAccount) {
            $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $discountAccount, $totalDiscount, 0, 'Sales discount', $debtorTrans->cost_center_id, $rate);
        }
        if ($outputTax > 0.001) {
            $this->appendOutputTaxLines($lines, $transType, $typeNo, $reference, $tranDate, $outputTax, $debtorTrans->cost_center_id, false, $rate);
        }
        if ($freight > 0.001 && $shippingAccount) {
            $lines[] = $this->line($transType, $typeNo, $reference, $tranDate, $shippingAccount, 0, $freight, 'Freight charged', $debtorTrans->cost_center_id, $rate);
        }
    }

    /**
     * @return array<string, float>
     */
    private function salesRevenueByAccount(DebtorTrans $debtorTrans, int $transType, int $typeNo, ?string $fallbackSales): array
    {
        $details = DB::table('debtor_trans_details')
            ->where('debtor_trans_no', $typeNo)
            ->where('debtor_trans_type', $transType)
            ->get();

        if ($details->isEmpty()) {
            $net = round((float) ($debtorTrans->ov_amount ?? 0), 2);

            return $fallbackSales && $net > 0.001 ? [$fallbackSales => $net] : [];
        }

        $branchCode = (int) ($debtorTrans->branch_code ?? 0);
        $byAccount = [];

        foreach ($details as $detail) {
            $lineGross = SalesLinePricing::lineGross($detail);
            if ($lineGross < 0.001) {
                continue;
            }

            $itemAccounts = $this->stockItemAccounts((string) ($detail->stock_id ?? '')) ?? [];
            $account = $this->branchSalesAccount($branchCode, $itemAccounts) ?? $fallbackSales;
            if (! $account) {
                continue;
            }

            $byAccount[$account] = round(($byAccount[$account] ?? 0) + $lineGross, 2);
        }

        if ($byAccount === [] && $fallbackSales) {
            $byAccount[$fallbackSales] = round((float) ($debtorTrans->ov_amount ?? 0), 2);
        }

        return $byAccount;
    }

    private function salesLineDiscountTotal(DebtorTrans $debtorTrans, int $transType, int $typeNo): float
    {
        $details = DB::table('debtor_trans_details')
            ->where('debtor_trans_no', $typeNo)
            ->where('debtor_trans_type', $transType)
            ->get();

        $total = 0.0;
        foreach ($details as $detail) {
            $total += SalesLinePricing::lineDiscount($detail);
        }

        return round($total, 2);
    }

    private function purchaseLineDiscountTotal(int $typeNo, int $transType): float
    {
        if (! Schema::hasTable('supp_invoice_items')) {
            return 0.0;
        }

        $items = DB::table('supp_invoice_items')
            ->where('supp_trans_no', $typeNo)
            ->where('supp_trans_type', $transType)
            ->get();

        $total = 0.0;
        foreach ($items as $item) {
            $qty = abs((float) ($item->quantity ?? 0));
            $price = (float) ($item->unit_price ?? 0);
            $discPct = Schema::hasColumn('supp_invoice_items', 'discount_percent')
                ? (float) ($item->discount_percent ?? 0)
                : 0.0;
            if ($qty < 0.001 || $price < 0.001 || $discPct < 0.001) {
                continue;
            }
            $total += round($qty * $price * $discPct / 100, 2);
        }

        return round($total, 2);
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     */
    private function appendOutputTaxLines(
        array &$lines,
        int $transType,
        int $typeNo,
        string $reference,
        $tranDate,
        float $headerTax,
        $costCenter,
        bool $reverse,
        float $rate = 1.0
    ): void {
        $byType = $this->taxAmountsFromRegister($transType, $typeNo, true);

        if ($byType === []) {
            $account = $this->defaultSalesTaxAccount();
            if (! $account) {
                throw new GlPostingException('Configure sales_gl_account on at least one Tax Type for GST output posting.');
            }
            $lines[] = $this->line(
                $transType,
                $typeNo,
                $reference,
                $tranDate,
                $account,
                $reverse ? $headerTax : 0,
                $reverse ? 0 : $headerTax,
                'Output tax',
                $costCenter,
                $rate
            );

            return;
        }

        foreach ($byType as $taxTypeId => $amount) {
            if ($amount < 0.001) {
                continue;
            }
            $account = $this->taxTypeSalesAccount($taxTypeId);
            if (! $account) {
                throw new GlPostingException("Tax type {$taxTypeId} has no sales_gl_account configured.");
            }
            $lines[] = $this->line(
                $transType,
                $typeNo,
                $reference,
                $tranDate,
                $account,
                $reverse ? $amount : 0,
                $reverse ? 0 : $amount,
                'Output tax type '.$taxTypeId,
                $costCenter,
                $rate
            );
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     */
    private function appendPurchaseTaxLines(
        array &$lines,
        int $transType,
        int $typeNo,
        string $reference,
        $tranDate,
        float $headerTax,
        bool $reverse = false,
        float $rate = 1.0
    ): void {
        $byType = $this->taxAmountsFromRegister($transType, $typeNo, false);

        if ($byType === []) {
            $account = $this->defaultPurchaseTaxAccount();
            if (! $account) {
                throw new GlPostingException('Configure purchasing_gl_account on at least one Tax Type for GST input posting.');
            }
            $lines[] = $this->line(
                $transType,
                $typeNo,
                $reference,
                $tranDate,
                $account,
                $reverse ? 0 : $headerTax,
                $reverse ? $headerTax : 0,
                'Input tax',
                null,
                $rate
            );

            return;
        }

        foreach ($byType as $taxTypeId => $amount) {
            if ($amount < 0.001) {
                continue;
            }
            $account = $this->taxTypePurchaseAccount($taxTypeId);
            if (! $account) {
                throw new GlPostingException("Tax type {$taxTypeId} has no purchasing_gl_account configured.");
            }
            $lines[] = $this->line(
                $transType,
                $typeNo,
                $reference,
                $tranDate,
                $account,
                $reverse ? 0 : $amount,
                $reverse ? $amount : 0,
                'Input tax type '.$taxTypeId,
                null,
                $rate
            );
        }
    }

    /**
     * @return array<int, float>
     */
    private function taxAmountsFromRegister(int $transType, int $typeNo, bool $outputTax): array
    {
        if (! Schema::hasTable('trans_tax_details') || $typeNo <= 0) {
            return [];
        }

        $rows = DB::table('trans_tax_details')
            ->where('trans_type', $transType)
            ->where('trans_no', $typeNo)
            ->get();

        $byType = [];
        foreach ($rows as $row) {
            $taxTypeId = (int) ($row->tax_type_id ?? 0);
            if ($taxTypeId <= 0) {
                continue;
            }

            $regType = (int) ($row->reg_type ?? -1);
            $amount = (float) ($row->amount ?? 0);
            if ($amount < 0.001) {
                continue;
            }

            if ($outputTax && $regType !== 1 && $regType !== -1) {
                continue;
            }
            if (! $outputTax && $regType !== 0 && $regType !== -1) {
                continue;
            }

            $byType[$taxTypeId] = ($byType[$taxTypeId] ?? 0) + $amount;
        }

        return $byType;
    }

    private function defaultSalesTaxAccount(): ?string
    {
        if (! Schema::hasTable('tax_types')) {
            return null;
        }

        $code = DB::table('tax_types')
            ->where('inactive', 0)
            ->whereNotNull('sales_gl_account')
            ->where('sales_gl_account', '!=', '')
            ->orderBy('id')
            ->value('sales_gl_account');

        return $code ? trim((string) $code) : null;
    }

    private function defaultPurchaseTaxAccount(): ?string
    {
        if (! Schema::hasTable('tax_types')) {
            return null;
        }

        $code = DB::table('tax_types')
            ->where('inactive', 0)
            ->whereNotNull('purchasing_gl_account')
            ->where('purchasing_gl_account', '!=', '')
            ->orderBy('id')
            ->value('purchasing_gl_account');

        return $code ? trim((string) $code) : null;
    }

    private function taxTypeSalesAccount(int $taxTypeId): ?string
    {
        if ($taxTypeId <= 0 || ! Schema::hasTable('tax_types')) {
            return $this->defaultSalesTaxAccount();
        }

        $code = DB::table('tax_types')->where('id', $taxTypeId)->value('sales_gl_account');

        return $code ? trim((string) $code) : $this->defaultSalesTaxAccount();
    }

    private function taxTypePurchaseAccount(int $taxTypeId): ?string
    {
        if ($taxTypeId <= 0 || ! Schema::hasTable('tax_types')) {
            return $this->defaultPurchaseTaxAccount();
        }

        $code = DB::table('tax_types')->where('id', $taxTypeId)->value('purchasing_gl_account');

        return $code ? trim((string) $code) : $this->defaultPurchaseTaxAccount();
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     */
    private function insertBalancedLines(array $lines, string $failureMessage): void
    {
        if (count($lines) < 2) {
            throw new GlPostingException($failureMessage);
        }

        if (! $this->isBalanced($lines)) {
            throw new GlPostingException($failureMessage);
        }

        GlTransHelper::insertLines($lines);
    }

    private function line(
        int $transType,
        int $typeNo,
        string $reference,
        $date,
        string $account,
        float $debit,
        float $credit,
        string $memo,
        $costCenter = null,
        float $rate = 1.0
    ): array {
        return [
            'type' => $transType,
            'type_no' => $typeNo,
            'reference' => $reference,
            'date' => $date,
            'account' => $account,
            'debit' => CustomerExchangeRate::toHomeCurrency($debit, $rate),
            'credit' => CustomerExchangeRate::toHomeCurrency($credit, $rate),
            'memo' => $memo,
            'cost_center_id' => $costCenter,
        ];
    }
}
