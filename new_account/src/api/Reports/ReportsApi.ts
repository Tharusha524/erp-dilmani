import api from "../apiClient";

/** Unified PDF for any report key (see reportKeyFromTitle in Reports/reportKeys.ts) */
export const generateReportPdf = async (
  reportKey: string,
  params: Record<string, unknown>
) => {
  const response = await api.post(
    "/reports/generate",
    { reportKey, ...params },
    { responseType: "blob" }
  );
  return response.data;
};

export const generateCustomerBalancesReport = async (params: any) => {
  try {
    const response = await api.post("/reports/customer-balances", params, {
      responseType: "blob",
    });
    return response.data;
  } catch (error: any) {
    console.error("Error generating report:", error);
    throw error;
  }
};

export const generateAgedCustomerAnalysisReport = async (params: any) => {
  try {
    const response = await api.post("/reports/aged-customer-analysis", params, {
      responseType: "blob",
    });
    return response.data;
  } catch (error: any) {
    console.error("Error generating aged analysis report:", error);
    throw error;
  }
};

export const generateCustomerTrialBalanceReport = async (params: any) => {
  try {
    const response = await api.post("/reports/customer-trial-balance", params, {
      responseType: "blob",
    });
    return response.data;
  } catch (error: any) {
    console.error("Error generating trial balance report:", error);
    throw error;
  }
};

export const generateCustomerDetailListingReport = async (params: any) => {
  try {
    const response = await api.post("/reports/customer-detail-listing", params, {
      responseType: "blob",
    });
    return response.data;
  } catch (error: any) {
    console.error("Error generating detail listing report:", error);
    throw error;
  }
};

export const generateSalesSummaryReport = async (params: any) => {
  try {
    const response = await api.post("/reports/sales-summary", params, {
      responseType: "blob",
    });
    return response.data;
  } catch (error: any) {
    console.error("Error generating sales summary report:", error);
    throw error;
  }
};

