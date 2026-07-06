import api from "../api/apiClient";

function normalizeReportPdfParams(params: Record<string, unknown>): Record<string, unknown> {
  const out = { ...params };
  const dim = out.dimension;
  if (
    dim === "" ||
    dim === "no" ||
    dim === "All" ||
    dim === "NoFilter" ||
    dim === "0" ||
    dim === null ||
    dim === undefined
  ) {
    delete out.dimension;
  }
  if (out.orientation && typeof out.orientation === "string") {
    out.orientation = out.orientation.toLowerCase();
  }
  return out;
}

async function parseBlobError(error: unknown): Promise<never> {
  const err = error as { data?: Blob; response?: { data?: Blob } };
  const blob = err?.data ?? err?.response?.data;
  if (blob instanceof Blob) {
    const text = await blob.text();
    try {
      const parsed = JSON.parse(text) as { message?: string };
      throw new Error(parsed.message || text);
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== text) {
        throw parseError;
      }
      throw new Error(text || "Failed to generate report PDF");
    }
  }
  throw error;
}

export async function generateReportPdf(
  reportKey: string,
  params: Record<string, unknown>
): Promise<Blob> {
  try {
    const response = await api.post(
      "/reports/generate",
      { reportKey, ...normalizeReportPdfParams(params) },
      { responseType: "blob", skipErrorDialog: true } as Record<string, unknown>
    );

    const blob = response.data as Blob;
    if (blob.type && blob.type.includes("application/json")) {
      const text = await blob.text();
      const parsed = JSON.parse(text) as { message?: string };
      throw new Error(parsed.message || "Failed to generate report PDF");
    }

    return blob;
  } catch (error) {
    throw await parseBlobError(error);
  }
}

export function downloadPdfBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
