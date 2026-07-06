import api from "../apiClient";

export interface ActiveFiscalYearResponse {
  id: number | null;
  fiscal_year_from: string;
  fiscal_year_to: string;
  report_start: string;
  report_end: string;
  label: string;
  reference_suffix?: string;
  closed: boolean;
}

export interface NextFiscalYearReferenceResponse {
  reference: string | null;
  suffix: string;
  sequence: number | null;
  fiscal_year_id: number | null;
  fiscal_year_from: string;
  fiscal_year_to: string;
  trans_type: number;
  auto_increase_of_document_references?: boolean;
  manual_entry_required?: boolean;
}

export const getActiveFiscalYear = async (): Promise<ActiveFiscalYearResponse> => {
  const response = await api.get("/fiscal-years/active");
  return response.data;
};

export const getNextFiscalYearReference = async (
  transType: number,
  asOfDate?: string
): Promise<NextFiscalYearReferenceResponse> => {
  const response = await api.get("/fiscal-years/active/next-reference", {
    params: { trans_type: transType, ...(asOfDate ? { asOfDate } : {}) },
  });
  return response.data;
};
