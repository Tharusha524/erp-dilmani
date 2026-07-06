import type { AllocationTargetRow } from "../api/Allocation/AllocationApi";

export type AllocationRowState = AllocationTargetRow & { this_allocation: number };

/** Distribute payment/credit balance across open targets (FIFO). */
export function autoAllocateCustomerRows(
  targets: AllocationRowState[],
  available: number
): AllocationRowState[] {
  let remaining = Math.max(0, Number(available) || 0);

  return targets.map((row) => {
    if (remaining <= 0.001) {
      return { ...row, this_allocation: 0 };
    }
    const cap = Math.max(0, Number(row.left_to_allocate) || 0);
    const alloc = Math.min(cap, remaining);
    remaining = Math.round((remaining - alloc) * 100) / 100;
    return { ...row, this_allocation: Math.round(alloc * 100) / 100 };
  });
}

export function allocationLinesFromRows(rows: AllocationRowState[]) {
  return rows
    .filter((r) => Number(r.this_allocation) > 0)
    .map((r) => ({
      trans_no_to: r.trans_no,
      trans_type_to: r.trans_type,
      amt: Number(r.this_allocation),
    }));
}
