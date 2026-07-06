GL Posting helper and test instructions

Overview

This repo implements a centralized posting helper at:

- app/Services/Accounting/PostingsService.php

It provides:

- postDebtorInvoice(DebtorTrans $debtorTrans)
  - Posts AR and Sales lines and per-line COGS + Inventory rows (reads standard_cost from debtor_trans_details).
  - Idempotent: skips posting when gl_trans already has the same type + reference.

- postDebtorCreditNote(DebtorTrans $debtorTrans)
  - Reverses revenue and AR for credit notes.

- postBankPayment($bankTrans)
  - Posts Debit Bank (uses bank_accounts.account_gl_code) and Credit AR.

How to enable

The controllers are wired to call these helpers already:

- DebtorTransController::store will call the appropriate posting method (invoice/credit) when creating debtor_trans.
- BankTransController::store will call postBankPayment after creating bank_trans.

These calls are non-breaking and errors are logged; you can disable by removing the service from controller DI or commenting the call.

How to test locally (example)

1) Create an invoice via API (replace host/port):

```bash
curl -X POST http://localhost:8000/api/debtor-trans \
  -H "Content-Type: application/json" \
  -d '{
    "trans_no": 1001,
    "trans_type": 10,
    "debtor_no": 1,
    "tran_date": "2026-05-16",
    "reference": "INV-1001",
    "ov_amount": 150.00
  }'
```

2) Add details (lines):

```bash
curl -X POST http://localhost:8000/api/debtor-trans-details \
  -H "Content-Type: application/json" \
  -d '{
    "debtor_trans_no": 1001,
    "debtor_trans_type": 10,
    "stock_id": "ITEM-1",
    "description": "Test item",
    "unit_price": 50.00,
    "quantity": 3,
    "standard_cost": 30.00
  }'
```

After those calls the `PostingsService` will (if enabled) insert rows into `gl_trans`.

Validation queries (run against your DB)

- Verify debtor_trans header and details:

```sql
SELECT * FROM debtor_trans WHERE trans_no = 1001;
SELECT * FROM debtor_trans_details WHERE debtor_trans_no = 1001;
```

- Verify GL postings for that invoice (by reference):

```sql
SELECT * FROM gl_trans WHERE reference = 'INV-1001' ORDER BY date, id;
```

You should see AR debit, Sales credit, and COGS debit / Inventory credit rows when standard_cost exists.

Notes

- The helper is intentionally minimal: expand it to include tax handling, discounts, dimension logic, and multi-currency rounding as needed.
- Idempotency check uses `type` and `reference`. If your environment generates different references, adapt the uniqueness test accordingly.

If you want, I can:
- Add unit tests that bootstrap the app with sqlite memory and assert DB rows are created.
- Run a sample invoice locally and show the resulting DB rows (if you want me to run against your dev DB, confirm connection settings or run the commands above locally).