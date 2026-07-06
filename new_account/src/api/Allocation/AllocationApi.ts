import api from "../apiClient";

export interface AllocationTargetRow {
  trans_no: number;
  trans_type: number;
  type_name: string;
  reference: string;
  supp_reference?: string;
  tran_date?: string;
  trans_date?: string;
  due_date?: string;
  amount: number;
  other_allocations: number;
  left_to_allocate: number;
  this_allocation?: number;
}

export const getCustomerAllocationOpen = async (transNo: number, transType: number) => {
  const { data } = await api.get(`/allocations/customer/${transNo}/${transType}`);
  return data as { from: Record<string, unknown>; targets: AllocationTargetRow[] };
};

export const getSupplierAllocationOpen = async (transNo: number, transType: number) => {
  const { data } = await api.get(`/allocations/supplier/${transNo}/${transType}`);
  return data as { from: Record<string, unknown>; targets: AllocationTargetRow[] };
};

export const processCustomerAllocations = async (payload: {
  trans_no_from: number;
  trans_type_from: number;
  date_alloc: string;
  lines: { trans_no_to: number; trans_type_to: number; amt: number }[];
}) => {
  const { data } = await api.post("/allocations/customer/process", payload);
  return data;
};

export const processSupplierAllocations = async (payload: {
  trans_no_from: number;
  trans_type_from: number;
  date_alloc: string;
  lines: { trans_no_to: number; trans_type_to: number; amt: number }[];
}) => {
  const { data } = await api.post("/allocations/supplier/process", payload);
  return data;
};

