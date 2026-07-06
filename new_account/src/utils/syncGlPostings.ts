import { getGlTransByTransaction } from "../api/GlTrans/GlTransApi";
import type { GlModule } from "../utils/exactReference";

export interface SyncGlPostingsParams {
  module?: GlModule;
  order_no?: number | string;
  purch_order_no?: number | string;
  trans_no?: number | string;
  trans_type?: number | string;
  reference?: string;
}

/** Trigger server-side GL repost + return gl_trans rows for a saved transaction. */
export async function syncGlPostings(params: SyncGlPostingsParams) {
  return getGlTransByTransaction({
    module: params.module,
    order_no: params.order_no,
    purch_order_no: params.purch_order_no,
    trans_no: params.trans_no,
    trans_type: params.trans_type,
    reference: params.reference,
  });
}
