import { useCallback, useContext } from "react";
import { useSnackbar } from "notistack";
import { ReportGenerationContext } from "../context/ReportGenerationContext";
import { downloadPdfBlob, generateReportPdf } from "../utils/reportPdfDownload";

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

      try {
        const blob = await generateReportPdf(reportKey, {
          ...payload,
          title,
        });

        const defaultName = `${reportKey}_${new Date().toISOString().slice(0, 10)}.pdf`;
        const fileName =
          typeof options.fileName === "function"
            ? options.fileName(payload)
            : options.fileName ?? defaultName;

        downloadPdfBlob(blob, fileName);
        enqueueSnackbar("Report PDF generated successfully", { variant: "success" });
      } catch (error) {
        console.error("Report PDF generation failed:", error);
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Failed to generate report PDF";
        enqueueSnackbar(message, { variant: "error" });
      }
    },
    [ctx?.reportKey, ctx?.reportTitle, options.validate, options.fileName, enqueueSnackbar]
  );
}
