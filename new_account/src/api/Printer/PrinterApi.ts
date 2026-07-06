import api from "../apiClient";

export interface Printer {
  id: number;
  name: string;
  description?: string;
  host?: string;
  port?: string;
  queue?: string;
  timeout?: number;
}

export const getPrinters = async (): Promise<Printer[]> => {
  const { data } = await api.get("/printers");
  return data;
};

export const getPrinter = async (id: number): Promise<Printer> => {
  const { data } = await api.get(`/printers/${id}`);
  return data;
};

export const createPrinter = async (payload: Omit<Printer, "id">) => {
  const { data } = await api.post("/printers", payload);
  return data;
};

export const updatePrinter = async (id: number, payload: Partial<Printer>) => {
  const { data } = await api.put(`/printers/${id}`, payload);
  return data;
};

export const deletePrinter = async (id: number) => {
  await api.delete(`/printers/${id}`);
};

