import api from "../apiClient";

const PURCH_ORDERS_URL = "/purch-orders"; 
// Adjust if backend base differs

// Backend validation requires order_no as primary integer
export interface PurchOrderPayload {
  order_no: number;             // Primary key
  supplier_id: number;         // FK from suppliers
  comments: string | null;
  ord_date: string;            // YYYY-MM-DD
  reference: string;           // Reference code
  requisition_no: string | null;
  into_stock_location: string; // loc_code
  delivery_address: string;
  total: number;
  prep_amount: number;
  alloc: number;
  tax_included: boolean;
}

/**
 * CREATE Purchase Order
 */
export const createPurchOrder = async (payload: PurchOrderPayload) => {
  const response = await api.post(PURCH_ORDERS_URL, payload);
  return response.data;
};

/**
 * UPDATE Purchase Order
 */
export const updatePurchOrder = async (
  orderNo: number,
  payload: PurchOrderPayload
) => {
  const response = await api.put(`${PURCH_ORDERS_URL}/${orderNo}`, payload);
  return response.data;
};

/**
 * GET All Purchase Orders
 */
export const getPurchOrders = async () => {
  const response = await api.get(PURCH_ORDERS_URL);
  return response.data;
};

/**
 * GET Single Purchase Order by Order No
 */
export const getPurchOrderByOrderNo = async (orderNo: string | number) => {
  try {
    const response = await api.get(`${PURCH_ORDERS_URL}/${orderNo}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching purchase order ${orderNo}:`, error);
    return null;
  }
};

/**
 * DELETE Purchase Order
 */
export const deletePurchOrder = async (orderNo: number) => {
  const response = await api.delete(`${PURCH_ORDERS_URL}/${orderNo}`);
  return response.data;
};

/**
 * Generate Provisional Order No (Frontend fallback)
 */
export const generateProvisionalPurchOrderNo = (): number => {
  return Date.now();
};

export interface PurchOrderLinePayload {
  item_code: string;
  description?: string;
  delivery_date?: string;
  qty_invoiced?: number;
  unit_price: number;
  act_price?: number;
  std_cost_unit?: number;
  quantity_ordered: number;
  quantity_received?: number;
  po_detail_item?: number;
  id?: number;
}

export const postPurchOrderWithDetails = async (payload: {
  header: PurchOrderPayload;
  lines: PurchOrderLinePayload[];
  delete_detail_ids?: number[];
}) => {
  const response = await api.post(`${PURCH_ORDERS_URL}/post-with-details`, payload);
  return response.data as { order: PurchOrderPayload & { order_no: number }; order_no: number; lines: unknown[] };
};

export const getNextPurchOrderNo = async (): Promise<number> => {
  try {
    const response = await api.get(`${PURCH_ORDERS_URL}/next-order-no`);
    return response.data?.order_no ?? 1;
  } catch {
    return Date.now();
  }
};


