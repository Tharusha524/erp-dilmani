<?php

namespace App\Http\Controllers;

use App\Models\WoSheetEvent;
use App\Models\WoSheetOrder;
use App\Models\WoSheetOrderPriceItem;
use App\Models\WoSheetOrderSize;
use App\Models\WoSheetStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WoSheetOrderController extends Controller
{
    /**
     * List all work orders for the Work Order Dashboard / Create Work Order tables.
     */
    public function index(): JsonResponse
    {
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
                'wo_sheet_statuses.name as status_name',
                'wo_sheet_statuses.sequence_order as status_sequence_order',
                'user_managements.first_name as created_by_first_name',
                'user_managements.last_name as created_by_last_name',
                'assigned_user.first_name as assigned_to_first_name',
                'assigned_user.last_name as assigned_to_last_name',
            ])
            ->get()
            ->map(function ($row) {
                $row->created_by = trim(($row->created_by_first_name ?? '') . ' ' . ($row->created_by_last_name ?? ''));
                $row->assigned_to = trim(($row->assigned_to_first_name ?? '') . ' ' . ($row->assigned_to_last_name ?? ''));
                unset($row->created_by_first_name, $row->created_by_last_name, $row->assigned_to_first_name, $row->assigned_to_last_name);
                return $row;
            });

        return response()->json($orders);
    }

    public function show(int $id): JsonResponse
    {
        $order = WoSheetOrder::with(['sizes', 'priceItems', 'events', 'currentStatus'])->find($id);
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

        $sequence = (int) (WoSheetOrder::max('id') ?? 0) + 1;
        $workOrderNo = 'WO-' . now()->format('Ymd') . '-' . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);

        $order = DB::transaction(function () use ($request, $data, $processType, $firstStatus, $workOrderNo) {
            $order = WoSheetOrder::create([
                'work_order_no' => $workOrderNo,
                'branch' => $data['branch'] ?? null,
                'order_date' => $data['order_date'] ?? null,
                'delivery_date' => $data['delivery_date'] ?? null,
                'customer' => $data['customer'] ?? null,
                'contact_no' => $data['contact_no'] ?? null,
                'kind_of_fabric' => $data['kind_of_fabric'] ?? null,
                'description' => $data['description'] ?? null,
                'category' => $data['category'],
                'sub_category' => $data['sub_category'] ?? null,
                'department' => $data['department'] ?? $request->user()?->department,
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
            $order->fresh(['sizes', 'priceItems', 'events', 'currentStatus']),
            201
        );
    }

    public function checkIn(Request $request, int $id): JsonResponse
    {
        $order = WoSheetOrder::find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
        }

        WoSheetEvent::create([
            'wo_sheet_order_id' => $order->id,
            'event_type' => 'check_in',
            'description' => 'Checked in',
            'status_id' => $order->current_status_id,
            'user_id' => $request->user()?->id,
            'event_datetime' => now(),
        ]);

        return response()->json($order->fresh(['sizes', 'priceItems', 'events', 'currentStatus']));
    }

    /**
     * Advance the order by exactly one status step (e.g. Day 3 -> Day 4).
     *
     * Locked to whoever checked in on the current status: if a check_in
     * event exists for this order's current status, only that same user
     * may advance it. If nobody has checked in yet, anyone may advance it.
     */
    public function nextStatus(Request $request, int $id): JsonResponse
    {
        $order = WoSheetOrder::find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
        }

        $lastCheckIn = WoSheetEvent::where('wo_sheet_order_id', $order->id)
            ->where('event_type', 'check_in')
            ->where('status_id', $order->current_status_id)
            ->orderByDesc('id')
            ->first();

        if ($lastCheckIn && $lastCheckIn->user_id !== $request->user()?->id) {
            return response()->json([
                'message' => 'Only the user who checked in on this status can advance it.',
            ], 403);
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

        return response()->json($order->fresh(['sizes', 'priceItems', 'events', 'currentStatus']));
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

        return response()->json($order->fresh(['sizes', 'priceItems', 'events', 'currentStatus']));
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        $order = WoSheetOrder::find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
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

        return response()->json($order->fresh(['sizes', 'priceItems', 'events', 'currentStatus']));
    }

    public function reopen(Request $request, int $id): JsonResponse
    {
        $order = WoSheetOrder::find($id);
        if (! $order) {
            return response()->json(['message' => 'Work order not found'], 404);
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

        return response()->json($order->fresh(['sizes', 'priceItems', 'events', 'currentStatus']));
    }
}
