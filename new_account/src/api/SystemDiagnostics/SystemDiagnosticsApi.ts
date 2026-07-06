import api from "../apiClient";

export type DiagnosticStatus = "ok" | "warning" | "error";

export interface DiagnosticLine {
  id: number;
  test: string;
  test_type: string;
  value: string;
  status: DiagnosticStatus;
  comments: string;
}

export interface SystemDiagnosticsResult {
  ran_at: string;
  summary: {
    ok: number;
    warning: number;
    error: number;
    total: number;
  };
  lines: DiagnosticLine[];
}

export const getSystemDiagnostics = async (): Promise<SystemDiagnosticsResult> => {
  const { data } = await api.get<SystemDiagnosticsResult>("/system-diagnostics");
  return data;
};

