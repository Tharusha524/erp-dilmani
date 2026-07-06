import React, { createContext, useContext } from "react";

interface ReportGenerationContextValue {
  reportKey: string;
  reportTitle: string;
}

export const ReportGenerationContext = createContext<ReportGenerationContextValue | null>(null);

export function ReportGenerationProvider({
  reportKey,
  reportTitle,
  children,
}: {
  reportKey: string;
  reportTitle: string;
  children: React.ReactNode;
}) {
  return (
    <ReportGenerationContext.Provider value={{ reportKey, reportTitle }}>
      {children}
    </ReportGenerationContext.Provider>
  );
}

export function useReportGenerationContext() {
  const ctx = useContext(ReportGenerationContext);
  if (!ctx) {
    throw new Error("useReportGenerationContext must be used within ReportGenerationProvider");
  }
  return ctx;
}
