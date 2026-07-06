import api from "../apiClient";

export type EntityAttachmentType = "customer" | "supplier" | "item" | "fixed_asset";

export interface EntityAttachment {
  id: number;
  entity_type: EntityAttachmentType;
  entity_id: string;
  doc_title: string;
  doc_date: string;
  original_filename: string;
  mime_type?: string;
  size: number;
  inactive: boolean;
  download_url: string;
  filetype: string;
  formatted_size: string;
}

export const getEntityAttachments = async (
  entityType: EntityAttachmentType,
  entityId: string | number,
  includeInactive = false
): Promise<EntityAttachment[]> => {
  try {
    const response = await api.get("/entity-attachments", {
      params: {
        entity_type: entityType,
        entity_id: String(entityId),
        include_inactive: includeInactive,
      },
      skipErrorDialog: true,
    } as Parameters<typeof api.get>[1]);
    return response.data;
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 404) {
      return [];
    }
    throw err;
  }
};

export const createEntityAttachment = async (formData: FormData): Promise<EntityAttachment> => {
  const response = await api.post("/entity-attachments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateEntityAttachment = async (
  id: number,
  formData: FormData
): Promise<EntityAttachment> => {
  formData.append("_method", "PUT");
  const response = await api.put(`/entity-attachments/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteEntityAttachment = async (id: number): Promise<void> => {
  await api.delete(`/entity-attachments/${id}`);
};

export const downloadEntityAttachment = async (id: number, filename: string) => {
  const response = await api.get(`/entity-attachments/${id}/download`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};

