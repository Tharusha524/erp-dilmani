import {
  generateElementAsPdfBlob,
  sanitizePdfFilename,
} from "./downloadTransactionPrintPdf";
import { downloadPdfBlob } from "./reportPdfDownload";

export type TransactionEmailClient = "share" | "gmail" | "outlook" | "default";

export type EmailTransactionOptions = {
  element: HTMLElement;
  documentTitle: string;
  pdfFileName?: string;
  emailSubject?: string;
  emailBody?: string;
  recipient?: string;
  client: TransactionEmailClient;
};

function pdfFileName(base: string): string {
  const name = sanitizePdfFilename(base);
  return name.endsWith(".pdf") ? name : `${name}.pdf`;
}

function defaultEmailSubject(documentTitle: string): string {
  return documentTitle.replace(/\s+/g, " ").trim() || "ERP Document";
}

/** Body for server send — PDF is attached automatically. */
export function buildDefaultEmailBody(documentTitle: string): string {
  return [
    "Hello,",
    "",
    `Please find the attached document: ${documentTitle}.`,
    "",
    "Thank you.",
  ].join("\n");
}

function defaultEmailBodyWithManualAttach(documentTitle: string, file: string): string {
  return [
    "Hello,",
    "",
    `Please find the attached document: ${documentTitle}.`,
    "",
    `The PDF file "${file}" has been saved to your Downloads folder.`,
    "Attach that file to this email before sending.",
    "",
    "Thank you.",
  ].join("\n");
}

export function buildDefaultEmailSubject(documentTitle: string): string {
  return defaultEmailSubject(documentTitle);
}

export function buildGmailComposeUrl(subject: string, body: string, to = ""): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    su: subject,
    body,
  });
  if (to) {
    params.set("to", to);
  }
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function buildOutlookComposeUrl(subject: string, body: string, to = ""): string {
  const params = new URLSearchParams({ subject, body });
  if (to) {
    params.set("to", to);
  }
  return `https://outlook.live.com/mail/0/deeplink/compose?${params.toString()}`;
}

export function buildMailtoUrl(subject: string, body: string, to = ""): string {
  const params = new URLSearchParams({ subject, body });
  if (to) {
    return `mailto:${to}?${params.toString()}`;
  }
  return `mailto:?${params.toString()}`;
}

export function canSharePdfFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.share) {
    return false;
  }
  try {
    const probe = new File([new Blob(["x"], { type: "application/pdf" })], "probe.pdf", {
      type: "application/pdf",
    });
    return Boolean(navigator.canShare?.({ files: [probe] }));
  } catch {
    return false;
  }
}

async function sharePdfFile(
  blob: Blob,
  filename: string,
  subject: string,
  body: string
): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  const file = new File([blob], filename, { type: "application/pdf" });
  const payload: ShareData = {
    title: subject,
    text: body,
    files: [file],
  };

  if (navigator.canShare && !navigator.canShare(payload)) {
    return false;
  }

  await navigator.share(payload);
  return true;
}

function openComposeWindow(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Generate PDF, download for manual attach, then open Gmail / Outlook / mailto.
 * Browsers cannot attach files to web-mail URLs — user attaches the downloaded PDF.
 */
export async function emailTransactionDocument(
  options: EmailTransactionOptions
): Promise<"shared" | "opened"> {
  const {
    element,
    documentTitle,
    pdfFileName: customPdfName,
    emailSubject,
    emailBody,
    recipient = "",
    client,
  } = options;

  const file = pdfFileName(customPdfName ?? documentTitle);
  const subject = emailSubject ?? defaultEmailSubject(documentTitle);
  const body = emailBody ?? defaultEmailBodyWithManualAttach(documentTitle, file);

  const blob = await generateElementAsPdfBlob(element);

  if (client === "share") {
    const shared = await sharePdfFile(blob, file, subject, body);
    if (shared) {
      return "shared";
    }
    throw new Error("Share not available on this device");
  }

  downloadPdfBlob(blob, file);

  if (client === "gmail") {
    openComposeWindow(buildGmailComposeUrl(subject, body, recipient));
  } else if (client === "outlook") {
    openComposeWindow(buildOutlookComposeUrl(subject, body, recipient));
  } else {
    window.location.href = buildMailtoUrl(subject, body, recipient);
  }

  return "opened";
}
