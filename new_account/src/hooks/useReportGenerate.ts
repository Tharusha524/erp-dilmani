import { useCallback, useContext } from "react";
import { useSnackbar } from "notistack";
import { ReportGenerationContext } from "../context/ReportGenerationContext";
import {
  downloadExcelBlob,
  downloadPdfBlob,
  generateReportExcel,
  generateReportPdf,
} from "../utils/reportPdfDownload";

interface UseReportGenerateOptions {
  validate?: () => boolean;
  fileName?: string | ((params: Record<string, unknown>) => string);
}

export function useReportGenerate(options: UseReportGenerateOptions = {}) {
  const ctx = useContext(ReportGenerationContext);
  const { enqueueSnackbar } = useSnackbar();

  return useCallback(
    async (formData: object) => {
      const payload = formData as Record<string, unknown>;
      if (options.validate && !options.validate()) {
        return;
      }

      if (!ctx?.reportKey) {
        enqueueSnackbar("Select a report from the Reports menu first", { variant: "warning" });
        return;
      }

      const reportKey = ctx.reportKey;
      const title = ctx?.reportTitle ?? "Report";
      const isExcel = String(payload.destination ?? "").toLowerCase() === "excel";

      try {
        const baseName =
          typeof options.fileName === "function"
            ? options.fileName(payload).replace(/\.pdf$/i, "")
            : (options.fileName ?? `${reportKey}_${new Date().toISOString().slice(0, 10)}`).replace(
                /\.pdf$/i,
                ""
              );

        if (isExcel) {
          const blob = await generateReportExcel(reportKey, { ...payload, title });
          downloadExcelBlob(blob, baseName);
          enqueueSnackbar("Report Excel generated successfully", { variant: "success" });
        } else {
          const blob = await generateReportPdf(reportKey, { ...payload, title });
          downloadPdfBlob(blob, baseName);
          enqueueSnackbar("Report PDF generated successfully", { variant: "success" });
        }
      } catch (error) {
        console.error("Report generation failed:", error);
        const message =
          error instanceof Error && error.message
            ? error.message
            : `Failed to generate report ${isExcel ? "Excel" : "PDF"}`;
        enqueueSnackbar(message, { variant: "error" });
      }
    },
    [ctx?.reportKey, ctx?.reportTitle, options.validate, options.fileName, enqueueSnackbar]
  );
}
