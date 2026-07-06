import api from "../apiClient";

export type SendTransactionDocumentEmailPayload = {
  to: string;
  subject: string;
  body: string;
  pdf: Blob;
  pdfFileName: string;
  documentTitle?: string;
};

export type SendTransactionDocumentEmailResponse = {
  message: string;
  to: string;
  delivered?: boolean;
  mail_driver?: string;
};

export async function sendTransactionDocumentEmail(
  payload: SendTransactionDocumentEmailPayload
): Promise<SendTransactionDocumentEmailResponse> {
  const fileName = payload.pdfFileName.endsWith(".pdf")
    ? payload.pdfFileName
    : `${payload.pdfFileName}.pdf`;

  const pdfFile = new File([payload.pdf], fileName, { type: "application/pdf" });

  const formData = new FormData();
  formData.append("to", payload.to);
  formData.append("subject", payload.subject);
  formData.append("body", payload.body);
  formData.append("pdf", pdfFile);
  if (payload.documentTitle) {
    formData.append("document_title", payload.documentTitle);
  }

  const response = await api.post<SendTransactionDocumentEmailResponse>(
    "/documents/send-email",
    formData,
    {
      // Let the browser set multipart boundary (do not force application/json or bare multipart).
      transformRequest: [
        (data, headers) => {
          const h = headers as Record<string, string | undefined>;
          delete h["Content-Type"];
          return data;
        },
      ],
    }
  );

  return response.data;
}
