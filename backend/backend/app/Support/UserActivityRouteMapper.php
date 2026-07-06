<?php

namespace App\Support;

use Illuminate\Http\Request;

class UserActivityRouteMapper
{
    /**
     * @return array{
     *     activity_type: string,
     *     module: ?string,
     *     entity_label: ?string,
     *     entity_id: ?string,
     *     description: string
     * }
     */
    public static function map(Request $request): array
    {
        $method = strtoupper($request->method());
        $path = UserActivityPath::relativePath($request);
        $segments = UserActivityPath::segments($request);

        if ($transaction = self::matchTransactionPath($path, $method)) {
            return $transaction;
        }

        $resource = $segments[0] ?? '';
        $entityId = self::extractEntityId($segments);
        $module = self::moduleLabel($resource);
        $activityType = self::defaultActivityType($method, $path);
        $description = self::buildDescription($activityType, $module, $path, $entityId);

        return [
            'activity_type' => $activityType,
            'module' => $module,
            'entity_label' => $module,
            'entity_id' => $entityId,
            'description' => $description,
        ];
    }

    /**
     * @param  list<string>  $segments
     */
    private static function extractEntityId(array $segments): ?string
    {
        foreach ($segments as $segment) {
            if (is_numeric($segment)) {
                return $segment;
            }
        }

        return null;
    }

    /**
     * @return array{
     *     activity_type: string,
     *     module: ?string,
     *     entity_label: ?string,
     *     entity_id: ?string,
     *     description: string
     * }|null
     */
    private static function matchTransactionPath(string $path, string $method): ?array
    {
        $rules = [
            ['#^sales-orders/post-with-details$#', 'Sales Order', 'post', 'Posted sales order'],
            ['#^purch-orders/post-with-details$#', 'Purchase Order', 'post', 'Posted purchase order'],
            ['#^sales/delivery/dispatch$#', 'Sales Delivery', 'post', 'Dispatched sales delivery'],
            ['#^sales/delivery/direct$#', 'Sales Delivery', 'post', 'Posted direct sales delivery'],
            ['#^sales/delivery/template/(\d+)$#', 'Sales Delivery', 'post', 'Dispatched sales delivery from order', 1],
            ['#^sales/delivery/(\d+)/void$#', 'Sales Delivery', 'void', 'Voided sales delivery', 1],
            ['#^sales/delivery/(\d+)$#', 'Sales Delivery', 'update', 'Updated sales delivery', 1],
            ['#^sales/invoice/from-delivery$#', 'Sales Invoice', 'post', 'Posted sales invoice from delivery'],
            ['#^sales/invoice/direct$#', 'Sales Invoice', 'post', 'Posted direct sales invoice'],
            ['#^sales/invoice/template/(\d+)$#', 'Sales Invoice', 'post', 'Posted sales invoice from order', 1],
            ['#^sales/invoice/prepaid-final/(\d+)$#', 'Sales Invoice', 'post', 'Posted prepaid final invoice', 1],
            ['#^sales/invoice/(\d+)/void$#', 'Sales Invoice', 'void', 'Voided sales invoice', 1],
            ['#^sales/invoice/(\d+)$#', 'Sales Invoice', 'update', 'Updated sales invoice', 1],
            ['#^sales/payments$#', 'Customer Payment', 'post', 'Posted customer payment'],
            ['#^sales/payments/(\d+)/void$#', 'Customer Payment', 'void', 'Voided customer payment', 1],
            ['#^sales/payments/(\d+)$#', 'Customer Payment', 'update', 'Updated customer payment', 1],
            ['#^sales/credit-notes$#', 'Sales Credit Note', 'post', 'Posted sales credit note'],
            ['#^sales/credit-notes/(\d+)/void$#', 'Sales Credit Note', 'void', 'Voided sales credit note', 1],
            ['#^sales/credit-notes/(\d+)$#', 'Sales Credit Note', 'update', 'Updated sales credit note', 1],
            ['#^purchases/grn/receive$#', 'Goods Receipt (GRN)', 'post', 'Received goods (GRN)'],
            ['#^purchases/grn/direct$#', 'Goods Receipt (GRN)', 'post', 'Posted direct GRN'],
            ['#^purchases/grn/(\d+)/void$#', 'Goods Receipt (GRN)', 'void', 'Voided GRN batch', 1],
            ['#^purchases/invoice/from-grn$#', 'Supplier Invoice', 'post', 'Posted supplier invoice from GRN'],
            ['#^purchases/invoice/direct$#', 'Supplier Invoice', 'post', 'Posted direct supplier invoice'],
            ['#^purchases/invoice/(\d+)/void$#', 'Supplier Invoice', 'void', 'Voided supplier invoice', 1],
            ['#^purchases/invoice/(\d+)$#', 'Supplier Invoice', 'update', 'Updated supplier invoice', 1],
            ['#^purchases/payments$#', 'Supplier Payment', 'post', 'Posted supplier payment'],
            ['#^purchases/payments/(\d+)/void$#', 'Supplier Payment', 'void', 'Voided supplier payment', 1],
            ['#^purchases/payments/(\d+)$#', 'Supplier Payment', 'update', 'Updated supplier payment', 1],
            ['#^purchases/credit-notes$#', 'Supplier Credit Note', 'post', 'Posted supplier credit note'],
            ['#^purchases/credit-notes/(\d+)/void$#', 'Supplier Credit Note', 'void', 'Voided supplier credit note', 1],
            ['#^purchases/credit-notes/(\d+)$#', 'Supplier Credit Note', 'update', 'Updated supplier credit note', 1],
            ['#^banking/payment$#', 'Bank Payment', 'post', 'Posted bank payment'],
            ['#^banking/payment/(\d+)$#', 'Bank Payment', 'update', 'Updated bank payment', 1],
            ['#^banking/deposit$#', 'Bank Deposit', 'post', 'Posted bank deposit'],
            ['#^banking/transfer$#', 'Bank Transfer', 'post', 'Posted bank transfer'],
            ['#^banking/journal$#', 'Bank Journal', 'post', 'Posted bank journal entry'],
            ['#^banking/journal/(\d+)$#', 'Bank Journal', 'update', 'Updated bank journal entry', 1],
            ['#^banking/reconcile$#', 'Bank Reconciliation', 'post', 'Posted bank reconciliation'],
            ['#^banking/accruals/process$#', 'Bank Accruals', 'post', 'Processed bank accruals'],
            ['#^inventory/transfers$#', 'Inventory Transfer', 'post', 'Posted inventory transfer'],
            ['#^inventory/adjustments$#', 'Inventory Adjustment', 'post', 'Posted inventory adjustment'],
            ['#^void-transactions$#', 'Void Transaction', 'void', 'Voided transaction'],
            ['#^allocations/customer/process$#', 'Customer Allocation', 'post', 'Processed customer allocation'],
            ['#^allocations/supplier/process$#', 'Supplier Allocation', 'post', 'Processed supplier allocation'],
            ['#^journals/trans/(\d+)/(\d+)$#', 'Journal Entry', 'delete', 'Deleted journal transaction', 2],
            ['#^manufacturing/work-orders/entry$#', 'Work Order', 'post', 'Created work order entry'],
            ['#^manufacturing/work-orders/issue$#', 'Work Order', 'post', 'Issued materials to work order'],
            ['#^manufacturing/work-orders/produce$#', 'Work Order', 'post', 'Produced finished goods from work order'],
            ['#^manufacturing/work-orders/cost$#', 'Work Order', 'post', 'Posted work order additional cost'],
            ['#^manufacturing/work-orders/(\d+)/release$#', 'Work Order', 'post', 'Released work order', 1],
            ['#^fixed-assets/purchase$#', 'Fixed Asset', 'post', 'Posted fixed asset purchase'],
            ['#^fixed-assets/opening-balance$#', 'Fixed Asset', 'post', 'Posted fixed asset opening balance'],
            ['#^fixed-assets/transfer$#', 'Fixed Asset', 'post', 'Posted fixed asset transfer'],
            ['#^fixed-assets/disposal$#', 'Fixed Asset', 'post', 'Posted fixed asset disposal'],
            ['#^fixed-assets/sale$#', 'Fixed Asset', 'post', 'Posted fixed asset sale'],
            ['#^fa-depreciation/process$#', 'Fixed Asset Depreciation', 'post', 'Processed depreciation run'],
            ['#^recurrent-invoices/(\d+)/generate$#', 'Recurrent Invoice', 'post', 'Generated recurrent invoice', 1],
            ['#^recurrent-invoices/generate-all-due$#', 'Recurrent Invoice', 'post', 'Generated all due recurrent invoices'],
            ['#^documents/send-email$#', 'Document Email', 'post', 'Emailed transaction document'],
            ['#^quotations/(\d+)/send-email$#', 'Quotation', 'post', 'Emailed quotation', 1],
            ['#^quotations/(\d+)/status$#', 'Quotation', 'update', 'Updated quotation status', 1],
            ['#^fiscal-years/(\d+)/rollover$#', 'Fiscal Year', 'post', 'Rolled over fiscal year', 1],
            ['#^fiscal-years/rollover$#', 'Fiscal Year', 'post', 'Rolled over fiscal year'],
        ];

        foreach ($rules as $rule) {
            [$pattern, $module, $type, $verb, $idGroup] = array_pad($rule, 5, null);
            if (! preg_match($pattern, $path, $matches)) {
                continue;
            }

            $entityId = $idGroup ? ($matches[$idGroup] ?? null) : null;
            $description = $entityId ? "{$verb} #{$entityId}" : $verb;

            return [
                'activity_type' => $type,
                'module' => $module,
                'entity_label' => $module,
                'entity_id' => $entityId,
                'description' => "{$description} ({$path})",
            ];
        }

        if (str_contains($path, '/void')) {
            return [
                'activity_type' => 'void',
                'module' => self::humanize($path),
                'entity_label' => self::humanize($path),
                'entity_id' => self::extractEntityId(explode('/', $path)),
                'description' => "Voided transaction ({$path})",
            ];
        }

        return null;
    }

    private static function defaultActivityType(string $method, string $path): string
    {
        if (str_contains($path, 'void-transactions')) {
            return 'void';
        }
        if (preg_match('#/(post|receive|dispatch|direct|process|generate|produce|release|issue|payment|deposit|transfer|reconcile|rollover)(/|$)#', $path)) {
            return 'post';
        }

        return match ($method) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => 'action',
        };
    }

    private static function moduleLabel(string $resource): ?string
    {
        $map = [
            'debtors-master' => 'Customer',
            'suppliers' => 'Supplier',
            'sales-orders' => 'Sales Order',
            'debtor-trans' => 'Customer Transaction',
            'supp-trans' => 'Supplier Transaction',
            'grn-batch' => 'GRN Batch',
            'grn-items' => 'GRN Item',
            'purch-orders' => 'Purchase Order',
            'journals' => 'Journal Entry',
            'gl-trans' => 'GL Transaction',
            'stock-moves' => 'Stock Movement',
            'stock-masters' => 'Inventory Item',
            'work-orders' => 'Work Order',
            'bom' => 'Bill of Materials',
            'crm-persons' => 'Contact',
            'crm-contacts' => 'CRM Contact',
            'user-management' => 'User',
            'security-roles' => 'Security Role',
            'chart-master' => 'GL Account',
            'chart-masters' => 'GL Account',
            'audit-trails' => 'Audit Trail',
            'quotations' => 'Quotation',
            'recurrent-invoices' => 'Recurrent Invoice',
            'bank-trans' => 'Bank Transaction',
            'budget-trans' => 'Budget',
            'customer-branch' => 'Customer Branch',
        ];

        return $map[$resource] ?? self::humanize($resource);
    }

    private static function buildDescription(
        string $activityType,
        ?string $module,
        string $path,
        ?string $entityId
    ): string {
        $verb = match ($activityType) {
            'create' => 'Created',
            'update' => 'Updated',
            'delete' => 'Deleted',
            'void' => 'Voided',
            'post' => 'Posted',
            default => 'Performed action on',
        };

        $target = trim(($module ?? 'record').($entityId ? " #{$entityId}" : ''));

        return "{$verb} {$target} ({$path})";
    }

    private static function humanize(string $value): string
    {
        return ucwords(str_replace(['-', '_', '/'], ' ', $value));
    }
}
