<?php

namespace App\Http\Controllers;

use App\Models\WoSheetEvent;
use App\Models\WoSheetOrder;
use App\Models\WoSheetOrderPriceItem;
use App\Models\WoSheetOrderSize;
use App\Models\WoSheetButtonAssignment;
use App\Models\WoSheetStatus;
use App\Models\WoSheetStatusAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WoSheetOrderController extends Controller
{
    /**
     * Only a user assigned as responsible for the order's current status
     * (set in Work Order Settings) may act on it — Admins always may.
     * Statuses with no assignments stay open to everyone (unchanged
     * behaviour). Multiple users may be assigned to the same status.
     * Returns a 403 response to short-circuit with, or null to allow the
     * action to proceed.
     */
    private function authorizeStatusAction(Request $request, WoSheetOrder $order): ?JsonResponse
    {
        $user = $request->user();

        if ($user && strcasecmp((string) $user->role, 'Admin') === 0) {
            return null;
        }

        $assignedUserIds = WoSheetStatusAssignment::where('status_id', $order->current_status_id)
            ->pluck('user_id');

        if ($assignedUserIds->isEmpty()) {
            return null;
        }

        if ($user && $assignedUserIds->contains(fn ($id) => (int) $id === (int) $user->id)) {
            return null;
        }

        return response()->json([
            'message' => 'Only a user assigned as responsible for this status can do that.',
        ], 403);
    }

    /**
     * Only a user assigned to a given button (Finish/Verify/Re-Open, set in
     * Work Order Settings) may click it — Admins always may. Buttons with
     * no assignments stay open to everyone. Multiple users may be assigned
     * to the same button. Returns a 403 response to short-circuit with, or
     * null to allow the action to proceed.
     */
    private function authorizeButtonAction(Request $request, string $buttonKey): ?JsonResponse
    {
        $user = $request->user();

        if ($user && strcasecmp((string) $user->role, 'Admin') === 0) {
            return null;
        }

        $assignedUserIds = WoSheetButtonAssignment::where('button_key', $buttonKey)->pluck('user_id');

        if ($assignedUserIds->isEmpty()) {
            return null;
        }

        if ($user && $assignedUserIds->contains(fn ($id) => (int) $id === (int) $user->id)) {
            return null;
        }

        return response()->json([
            'message' => 'Only a user assigned to this button can do that.',
        ], 403);
    }

    /**
     * List all work orders for the Work Order Dashboard / Create Work Order tables.
     */
    public function index(): JsonResponse
    {
        // Pre-fetch the highest sequence_order per category+process_type so we
        // can flag orders sitting at their final workflow status as "finished".
        $maxSequences = WoSheetStatus::select('category', 'process_type', DB::raw('MAX(sequence_order) as max_seq'))
            ->groupBy('category', 'process_type')
            ->get()
            ->keyBy(fn ($s) => $s->category . '|' . $s->process_type);

        $orders = WoSheetOrder::query()
            ->leftJoin('wo_sheet_statuses', 'wo_sheet_statuses.id', '=', 'wo_sheet_orders.current_status_id')
            ->leftJoin('user_managements', 'user_managements.id', '=', 'wo_sheet_orders.created_user_id')
            ->leftJoin('wo_sheet_status_assignments', 'wo_sheet_status_assignments.status_id', '=', 'wo_sheet_orders.current_status_id')
            ->leftJoin('user_managements as assigned_user', 'assigned_user.id', '=', 'wo_sheet_status_assignments.user_id')
            ->orderByDesc('wo_sheet_orders.id')
            ->select([
                'wo_sheet_orders.id',
                'wo_sheet_orders.work_order_no',
                'wo_sheet_orders.created_at',
                'wo_sheet_orders.updated_at',
                'wo_sheet_orders.order_date',
                'wo_sheet_orders.delivery_date',
                'wo_sheet_orders.branch',
                'wo_sheet_orders.customer',
                'wo_sheet_orders.department',
                'wo_sheet_orders.category',
                'wo_sheet_orders.sub_category',
                'wo_sheet_orders.description',
                'wo_sheet_orders.process_type',
                'wo_sheet_orders.order_quantity',
                'wo_sheet_orders.total_price',
                'wo_sheet_orders.advance',
                'wo_sheet_orders.balance',
                'wo_sheet_orders.reopen_datetime',
                'wo_sheet_orders.final_verify_user_id',
                'wo_sheet_orders.final_hand_over_user_id',
                'wo_sheet_statuses.name as status_name',
                'wo_sheet_statuses.sequence_order as status_sequence_order',
                'user_managements.first_name as created_by_first_name',
                'user_managements.last_name as created_by_last_name',
                'assigned_user.first_name as assigned_to_first_name',
                'assigned_user.last_name as assigned_to_last_name',
            ])
            ->get()
            ->map(function ($row) use ($maxSequences) {
                $row->created_by = trim(($row->created_by_first_name ?? '') . ' ' . ($row->created_by_last_name ?? ''));
                $row->assigned_to = trim(($row->assigned_to_first_name ?? '') . ' ' . ($row->assigned_to_last_name ?? ''));
                unset($row->created_by_first_name, $row->created_by_last_name, $row->assigned_to_first_name, $row->assigned_to_last_name);

                // An order is "finished" when its current status is the last
                // (highest sequence_order) step in its workflow.
                $key = $row->category . '|' . $row->process_type;
                $maxSeq = $maxSequences[$key]->max_seq ?? null;
                $row->is_finished = $maxSeq !== null && (int) $row->status_sequence_order === (int) $maxSeq;

                // Verify only unlocks Hand Over — an order is "completed"
                // only once someone has clicked Hand Over.
                $row->is_verified = $row->final_verify_user_id !== null;
                $row->is_handed_over = $row->final_hand_over_user_id !== null;
                unset($row->final_verify_user_id, $row->final_hand_over_user_id);

                return $row;
            });

        return response()->json($orders);
    }

    public function show(int $id): JsonResponse
    {
        $order = WoSheetOrder::with(['sizes', 'priceItems', 'events.user', 'currentStatus'])->find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
        }

        return response()->json($order);
    }

    /**
     * Create a new work order (the "Add Work Order" order sheet), together with
     * its size grid and price line items, in one atomic save.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'branch' => 'nullable|string|max:100',
            'order_date' => 'nullable|date',
            'delivery_date' => 'nullable|date',
            'customer' => 'nullable|string|max:150',
            'contact_no' => 'nullable|string|max:30',
            'kind_of_fabric' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'sub_category' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'related_department' => 'nullable|string|max:100',
            'factory_code' => 'nullable|string|max:30',
            'invoice_reference' => 'nullable|string|max:60',
            'machine_category' => 'nullable|string|max:100',
            'machine_category_no' => 'nullable|string|max:60',
            'value_add' => 'nullable|string|max:100',
            'order_quantity' => 'nullable|integer|min:0',
            'embroider_front' => 'nullable|string|max:100',
            'embroider_back' => 'nullable|string|max:100',
            'embroider_sleeves' => 'nullable|string|max:100',
            'embroider_others' => 'nullable|string|max:100',
            'remark' => 'nullable|string',
            'total_price' => 'nullable|numeric',
            'advance' => 'nullable|numeric',
            'balance' => 'nullable|numeric',
            'front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:4096',
            'back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:4096',
            'sizes' => 'nullable|array',
            'sizes.*.category' => 'required_with:sizes|string|max:30',
            'sizes.*.size_label' => 'required_with:sizes|string|max:10',
            'sizes.*.quantity' => 'nullable|integer|min:0',
            'price_items' => 'nullable|array',
            'price_items.*.item_name' => 'required_with:price_items|string|max:60',
            'price_items.*.price' => 'nullable|numeric',
        ]);

        $quantity = $data['order_quantity'] ?? 0;
        $processType = $quantity > 200 ? 'bulk' : 'normal';

        $firstStatus = WoSheetStatus::where('category', $data['category'])
            ->where('process_type', $processType)
            ->orderBy('sequence_order')
            ->first();

        // Each department (Factory/Printing/Embroidery) gets its own
        // independent WO-{code}-{8 digit sequence} numbering series, e.g.
        // WO-FA-0000 0001, WO-PR-0000 0001, WO-EM-0000 0001. Orders with no
        // department (legacy) or an unrecognised value count as Factory.
        $departmentCodes = ['Factory' => 'FA', 'Printing' => 'PR', 'Embroidery' => 'EM'];
        $department = $data['department'] ?? $request->user()?->department;
        $departmentCode = $departmentCodes[$department] ?? 'FA';

        $departmentCountQuery = WoSheetOrder::query();
        if ($departmentCode === 'FA') {
            $departmentCountQuery->where(function ($q) {
                $q->whereNull('department')->orWhereNotIn('department', ['Printing', 'Embroidery']);
            });
        } else {
            $departmentCountQuery->where('department', $department);
        }
        $sequence = $departmentCountQuery->count() + 1;
        $paddedSequence = str_pad((string) $sequence, 8, '0', STR_PAD_LEFT);
        $groupedSequence = substr($paddedSequence, 0, 4) . ' ' . substr($paddedSequence, 4);
        $workOrderNo = "WO-{$departmentCode}-{$groupedSequence}";

        $order = DB::transaction(function () use ($request, $data, $department, $processType, $firstStatus, $workOrderNo) {
            $order = WoSheetOrder::create([
                'work_order_no' => $workOrderNo,
                'invoice_reference' => $data['invoice_reference'] ?? null,
                'branch' => $data['branch'] ?? null,
                'order_date' => $data['order_date'] ?? null,
                'delivery_date' => $data['delivery_date'] ?? null,
                'customer' => $data['customer'] ?? null,
                'contact_no' => $data['contact_no'] ?? null,
                'kind_of_fabric' => $data['kind_of_fabric'] ?? null,
                'description' => $data['description'] ?? null,
                'category' => $data['category'],
                'sub_category' => $data['sub_category'] ?? null,
                'department' => $department,
                'related_department' => $data['related_department'] ?? null,
                'factory_code' => $data['factory_code'] ?? null,
                'machine_category' => $data['machine_category'] ?? null,
                'machine_category_no' => $data['machine_category_no'] ?? null,
                'value_add' => $data['value_add'] ?? null,
                'order_quantity' => $data['order_quantity'] ?? null,
                'process_type' => $processType,
                'current_status_id' => $firstStatus?->id,
                'embroider_front' => $data['embroider_front'] ?? null,
                'embroider_back' => $data['embroider_back'] ?? null,
                'embroider_sleeves' => $data['embroider_sleeves'] ?? null,
                'embroider_others' => $data['embroider_others'] ?? null,
                'remark' => $data['remark'] ?? null,
                'total_price' => $data['total_price'] ?? null,
                'advance' => $data['advance'] ?? null,
                'balance' => $data['balance'] ?? null,
                'server_datetime' => now(),
                'created_user_id' => $request->user()?->id,
            ]);

            if ($request->hasFile('front_image')) {
                $order->front_image_path = $request->file('front_image')->store('work_order_images', 'public');
            }
            if ($request->hasFile('back_image')) {
                $order->back_image_path = $request->file('back_image')->store('work_order_images', 'public');
            }
            if ($order->isDirty()) {
                $order->save();
            }

            foreach ($data['sizes'] ?? [] as $size) {
                if ((int) ($size['quantity'] ?? 0) <= 0) {
                    continue;
                }
                WoSheetOrderSize::create([
                    'wo_sheet_order_id' => $order->id,
                    'category' => $size['category'],
                    'size_label' => $size['size_label'],
                    'quantity' => $size['quantity'],
                ]);
            }

            foreach ($data['price_items'] ?? [] as $item) {
                if (! isset($item['price']) || $item['price'] === '') {
                    continue;
                }
                WoSheetOrderPriceItem::create([
                    'wo_sheet_order_id' => $order->id,
                    'item_name' => $item['item_name'],
                    'price' => $item['price'],
                ]);
            }

            WoSheetEvent::create([
                'wo_sheet_order_id' => $order->id,
                'event_type' => 'status_change',
                'description' => 'Work order created',
                'status_id' => $order->current_status_id,
                'user_id' => $request->user()?->id,
                'event_datetime' => now(),
            ]);

            return $order;
        });

        return response()->json(
            $order->fresh(['sizes', 'priceItems', 'events.user', 'currentStatus']),
            201
        );
    }

    /**
     * Update an existing work order's details (order sheet / job sheet
     * fields), replacing its size grid and price line items. Does not touch
     * the status workflow (current_status_id, process_type, work_order_no)
     * — those only change via check-in/next-status/set-status/close.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $order = WoSheetOrder::find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
        }

        if ($deny = $this->authorizeStatusAction($request, $order)) {
            return $deny;
        }

        $data = $request->validate([
            'branch' => 'nullable|string|max:100',
            'order_date' => 'nullable|date',
            'delivery_date' => 'nullable|date',
            'customer' => 'nullable|string|max:150',
            'contact_no' => 'nullable|string|max:30',
            'kind_of_fabric' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'sub_category' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'related_department' => 'nullable|string|max:100',
            'factory_code' => 'nullable|string|max:30',
            'invoice_reference' => 'nullable|string|max:60',
            'machine_category' => 'nullable|string|max:100',
            'machine_category_no' => 'nullable|string|max:60',
            'value_add' => 'nullable|string|max:100',
            'order_quantity' => 'nullable|integer|min:0',
            'embroider_front' => 'nullable|string|max:100',
            'embroider_back' => 'nullable|string|max:100',
            'embroider_sleeves' => 'nullable|string|max:100',
            'embroider_others' => 'nullable|string|max:100',
            'remark' => 'nullable|string',
            'total_price' => 'nullable|numeric',
            'advance' => 'nullable|numeric',
            'balance' => 'nullable|numeric',
            'front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:4096',
            'back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:4096',
            'sizes' => 'nullable|array',
            'sizes.*.category' => 'required_with:sizes|string|max:30',
            'sizes.*.size_label' => 'required_with:sizes|string|max:10',
            'sizes.*.quantity' => 'nullable|integer|min:0',
            'price_items' => 'nullable|array',
            'price_items.*.item_name' => 'required_with:price_items|string|max:60',
            'price_items.*.price' => 'nullable|numeric',
        ]);

        DB::transaction(function () use ($request, $data, $order) {
            // Friendly labels for the fields we track in the "what changed"
            // event description. Only columns listed here are ever reported.
            $fieldLabels = [
                'branch' => 'Branch',
                'order_date' => 'Order Date',
                'delivery_date' => 'Delivery Date',
                'customer' => 'Customer',
                'contact_no' => 'Contact No',
                'kind_of_fabric' => 'Kind of Fabric',
                'description' => 'Description',
                'category' => 'Category',
                'sub_category' => 'Sub Category',
                'department' => 'Department',
                'related_department' => 'Related Department',
                'factory_code' => 'Factory Code',
                'invoice_reference' => 'Invoice Reference',
                'machine_category' => 'Machine Category',
                'machine_category_no' => 'Machine Category No',
                'value_add' => 'Value Add',
                'order_quantity' => 'Quantity',
                'embroider_front' => 'Embroider Front',
                'embroider_back' => 'Embroider Back',
                'embroider_sleeves' => 'Embroider Sleeves',
                'embroider_others' => 'Embroider Others',
                'remark' => 'Remark',
                'total_price' => 'Total Price',
                'advance' => 'Advance',
                'balance' => 'Balance',
                'front_image_path' => 'Front Image',
                'back_image_path' => 'Back Image',
            ];

            // Human-readable "old → new" descriptions, not just field names.
            $formatValue = function ($value) {
                if ($value === null || $value === '') {
                    return '(empty)';
                }
                if ($value instanceof \Illuminate\Support\Carbon) {
                    return $value->format('Y-m-d');
                }
                return (string) $value;
            };
            // $rows: Collection of models or arrays; $labelFn/$valueFn extract
            // the two sides of "label: value" for each row.
            $describeRows = function ($rows, callable $labelFn, callable $valueFn) {
                $lines = collect($rows)->map(fn ($r) => $labelFn($r) . ': ' . $valueFn($r))->sort()->values();
                return $lines->isEmpty() ? '(none)' : $lines->implode(', ');
            };

            $originalDisplay = [];
            foreach ($fieldLabels as $column => $label) {
                $originalDisplay[$column] = $formatValue($order->getAttribute($column));
            }
            $oldSizesDisplay = $describeRows(
                $order->sizes()->get(),
                fn ($s) => "{$s->category} {$s->size_label}",
                fn ($s) => $s->quantity
            );
            $oldPriceItemsDisplay = $describeRows(
                $order->priceItems()->get(),
                fn ($p) => $p->item_name,
                fn ($p) => $p->price
            );

            $order->fill([
                'branch' => $data['branch'] ?? null,
                'order_date' => $data['order_date'] ?? null,
                'delivery_date' => $data['delivery_date'] ?? null,
                'customer' => $data['customer'] ?? null,
                'contact_no' => $data['contact_no'] ?? null,
                'kind_of_fabric' => $data['kind_of_fabric'] ?? null,
                'description' => $data['description'] ?? null,
                'category' => $data['category'],
                'sub_category' => $data['sub_category'] ?? null,
                'department' => $data['department'] ?? $order->department,
                'related_department' => $data['related_department'] ?? null,
                'factory_code' => $data['factory_code'] ?? null,
                'invoice_reference' => $data['invoice_reference'] ?? $order->invoice_reference,
                'machine_category' => $data['machine_category'] ?? null,
                'machine_category_no' => $data['machine_category_no'] ?? null,
                'value_add' => $data['value_add'] ?? null,
                'order_quantity' => $data['order_quantity'] ?? null,
                'embroider_front' => $data['embroider_front'] ?? null,
                'embroider_back' => $data['embroider_back'] ?? null,
                'embroider_sleeves' => $data['embroider_sleeves'] ?? null,
                'embroider_others' => $data['embroider_others'] ?? null,
                'remark' => $data['remark'] ?? null,
                'total_price' => $data['total_price'] ?? null,
                'advance' => $data['advance'] ?? null,
                'balance' => $data['balance'] ?? null,
            ]);

            if ($request->hasFile('front_image')) {
                $order->front_image_path = $request->file('front_image')->store('work_order_images', 'public');
            }
            if ($request->hasFile('back_image')) {
                $order->back_image_path = $request->file('back_image')->store('work_order_images', 'public');
            }

            $order->save();

            WoSheetOrderSize::where('wo_sheet_order_id', $order->id)->delete();
            foreach ($data['sizes'] ?? [] as $size) {
                if ((int) ($size['quantity'] ?? 0) <= 0) {
                    continue;
                }
                WoSheetOrderSize::create([
                    'wo_sheet_order_id' => $order->id,
                    'category' => $size['category'],
                    'size_label' => $size['size_label'],
                    'quantity' => $size['quantity'],
                ]);
            }

            WoSheetOrderPriceItem::where('wo_sheet_order_id', $order->id)->delete();
            foreach ($data['price_items'] ?? [] as $item) {
                if (! isset($item['price']) || $item['price'] === '') {
                    continue;
                }
                WoSheetOrderPriceItem::create([
                    'wo_sheet_order_id' => $order->id,
                    'item_name' => $item['item_name'],
                    'price' => $item['price'],
                ]);
            }

            $changes = [];
            foreach ($order->getChanges() as $column => $newValue) {
                if (! isset($fieldLabels[$column])) {
                    continue;
                }
                $label = $fieldLabels[$column];
                if (in_array($column, ['front_image_path', 'back_image_path'], true)) {
                    $changes[] = "{$label} updated";
                    continue;
                }
                $changes[] = "{$label}: {$originalDisplay[$column]} → " . $formatValue($newValue);
            }

            $newSizesDisplay = $describeRows(
                collect($data['sizes'] ?? [])->filter(fn ($s) => (int) ($s['quantity'] ?? 0) > 0),
                fn ($s) => "{$s['category']} {$s['size_label']}",
                fn ($s) => $s['quantity']
            );
            if ($newSizesDisplay !== $oldSizesDisplay) {
                $changes[] = "Sizes: {$oldSizesDisplay} → {$newSizesDisplay}";
            }

            $newPriceItemsDisplay = $describeRows(
                collect($data['price_items'] ?? [])->filter(fn ($p) => isset($p['price']) && $p['price'] !== ''),
                fn ($p) => $p['item_name'],
                fn ($p) => $p['price']
            );
            if ($newPriceItemsDisplay !== $oldPriceItemsDisplay) {
                $changes[] = "Price Items: {$oldPriceItemsDisplay} → {$newPriceItemsDisplay}";
            }

            $description = $changes
                ? 'Updated ' . implode('; ', $changes)
                : 'Work order details saved (no field changes detected)';

            WoSheetEvent::create([
                'wo_sheet_order_id' => $order->id,
                'event_type' => 'update',
                'description' => $description,
                'status_id' => $order->current_status_id,
                'user_id' => $request->user()?->id,
                'event_datetime' => now(),
            ]);
        });

        return response()->json($order->fresh(['sizes', 'priceItems', 'events.user', 'currentStatus']));
    }

    public function checkIn(Request $request, int $id): JsonResponse
    {
        $order = WoSheetOrder::find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
        }

        if ($deny = $this->authorizeStatusAction($request, $order)) {
            return $deny;
        }

        WoSheetEvent::create([
            'wo_sheet_order_id' => $order->id,
            'event_type' => 'check_in',
            'description' => 'Checked in',
            'status_id' => $order->current_status_id,
            'user_id' => $request->user()?->id,
            'event_datetime' => now(),
        ]);

        return response()->json($order->fresh(['sizes', 'priceItems', 'events.user', 'currentStatus']));
    }

    /**
     * Advance the order by exactly one status step (e.g. Day 3 -> Day 4).
     *
     * Locked to whoever is assigned as responsible for the current status
     * in Work Order Settings (see authorizeStatusAction).
     */
    public function nextStatus(Request $request, int $id): JsonResponse
    {
        $order = WoSheetOrder::find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
        }

        if ($deny = $this->authorizeStatusAction($request, $order)) {
            return $deny;
        }

        $currentStatus = $order->currentStatus;
        if (! $currentStatus) {
            return response()->json(['message' => 'Work order has no current status set.'], 422);
        }

        $nextStatus = WoSheetStatus::where('category', $currentStatus->category)
            ->where('process_type', $currentStatus->process_type)
            ->where('sequence_order', $currentStatus->sequence_order + 1)
            ->first();

        if (! $nextStatus) {
            return response()->json(['message' => 'Already at the final status.'], 422);
        }

        $order->current_status_id = $nextStatus->id;
        $order->save();

        WoSheetEvent::create([
            'wo_sheet_order_id' => $order->id,
            'event_type' => 'status_change',
            'description' => 'Advanced to ' . $nextStatus->name,
            'status_id' => $nextStatus->id,
            'user_id' => $request->user()?->id,
            'event_datetime' => now(),
        ]);

        return response()->json($order->fresh(['sizes', 'priceItems', 'events.user', 'currentStatus']));
    }

    /**
     * Move the order directly to any status within its own category +
     * process_type workflow (forward, backward, or skipped) — used for
     * cases like rework after a damaged item, where progress isn't strictly
     * sequential.
     */
    public function setStatus(Request $request, int $id): JsonResponse
    {
        $order = WoSheetOrder::find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
        }

        if ($deny = $this->authorizeStatusAction($request, $order)) {
            return $deny;
        }

        $data = $request->validate([
            'status_id' => 'required|integer|exists:wo_sheet_statuses,id',
        ]);

        $status = WoSheetStatus::find($data['status_id']);

        if ($status->category !== $order->category || $status->process_type !== $order->process_type) {
            return response()->json([
                'message' => 'That status does not belong to this work order\'s category/process type.',
            ], 422);
        }

        $order->current_status_id = $status->id;
        $order->save();

        WoSheetEvent::create([
            'wo_sheet_order_id' => $order->id,
            'event_type' => 'status_change',
            'description' => 'Status set to ' . $status->name,
            'status_id' => $status->id,
            'user_id' => $request->user()?->id,
            'event_datetime' => now(),
        ]);

        return response()->json($order->fresh(['sizes', 'priceItems', 'events.user', 'currentStatus']));
    }

    /**
     * Close the work order by advancing it to the last (final) status of
     * its category + process type workflow.
     */
    public function close(Request $request, int $id): JsonResponse
    {
        $order = WoSheetOrder::find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
        }

        if ($deny = $this->authorizeButtonAction($request, 'finish')) {
            return $deny;
        }

        $lastStatus = WoSheetStatus::where('category', $order->category)
            ->where('process_type', $order->process_type)
            ->orderByDesc('sequence_order')
            ->first();

        if ($lastStatus) {
            $order->current_status_id = $lastStatus->id;
            $order->save();
        }

        WoSheetEvent::create([
            'wo_sheet_order_id' => $order->id,
            'event_type' => 'close',
            'description' => 'Work order closed',
            'status_id' => $order->current_status_id,
            'user_id' => $request->user()?->id,
            'event_datetime' => now(),
        ]);

        return response()->json($order->fresh(['sizes', 'priceItems', 'events.user', 'currentStatus']));
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        $order = WoSheetOrder::find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
        }

        if ($deny = $this->authorizeButtonAction($request, 'verify')) {
            return $deny;
        }

        $order->final_verify_user_id = $request->user()?->id;
        $order->final_verify_date = now();
        $order->save();

        WoSheetEvent::create([
            'wo_sheet_order_id' => $order->id,
            'event_type' => 'verify',
            'description' => 'Final verified',
            'status_id' => $order->current_status_id,
            'user_id' => $request->user()?->id,
            'event_datetime' => now(),
        ]);

        return response()->json($order->fresh(['sizes', 'priceItems', 'events.user', 'currentStatus']));
    }

    /**
     * Hand Over is the real "order completed" signal — it's only allowed
     * once Verify has already been clicked on the order.
     */
    public function handOver(Request $request, int $id): JsonResponse
    {
        $order = WoSheetOrder::find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
        }

        if ($deny = $this->authorizeButtonAction($request, 'hand_over')) {
            return $deny;
        }

        if (! $order->final_verify_user_id) {
            return response()->json([
                'message' => 'This work order must be verified before it can be handed over.',
            ], 422);
        }

        $order->final_hand_over_user_id = $request->user()?->id;
        $order->final_hand_over_date = now();
        $order->save();

        WoSheetEvent::create([
            'wo_sheet_order_id' => $order->id,
            'event_type' => 'hand_over',
            'description' => 'Handed over',
            'status_id' => $order->current_status_id,
            'user_id' => $request->user()?->id,
            'event_datetime' => now(),
        ]);

        return response()->json($order->fresh(['sizes', 'priceItems', 'events.user', 'currentStatus']));
    }

    public function reopen(Request $request, int $id): JsonResponse
    {
        $order = WoSheetOrder::find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
        }

        if ($deny = $this->authorizeButtonAction($request, 'reopen')) {
            return $deny;
        }

        // Reset the status back to the first step in the workflow so the
        // order is no longer considered "finished".
        $firstStatus = WoSheetStatus::where('category', $order->category)
            ->where('process_type', $order->process_type)
            ->orderBy('sequence_order')
            ->first();

        if ($firstStatus) {
            $order->current_status_id = $firstStatus->id;
        }

        $order->reopen_datetime = now();
        $order->save();

        WoSheetEvent::create([
            'wo_sheet_order_id' => $order->id,
            'event_type' => 'reopen',
            'description' => 'Work order reopened',
            'status_id' => $order->current_status_id,
            'user_id' => $request->user()?->id,
            'event_datetime' => now(),
        ]);

        return response()->json($order->fresh(['sizes', 'priceItems', 'events.user', 'currentStatus']));
    }
}
