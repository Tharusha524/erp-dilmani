import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { downloadPdfBlob } from "./reportPdfDownload";

const A4_MARGIN_MM = 12;

export function sanitizePdfFilename(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .trim();
  return (cleaned || "document").slice(0, 120);
}

/**
 * Draws an already-loaded <img> onto a canvas and returns it as a data: URI —
 * no network re-fetch, so it works for the company logo (loaded as an
 * authenticated blob: URL the browser already has pixels for) without
 * hitting the auth/CORS/blob-scoping issues a fresh fetch() would.
 */
function loadedImageToDataUrl(img: HTMLImageElement): string | null {
  if (!img.complete || img.naturalWidth === 0) return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    // Tainted canvas (cross-origin image without CORS headers) — leave as-is.
    return null;
  }
}

/** Build PDF bytes from a print DOM node (A4, multi-page when needed). */
export async function generateElementAsPdfBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    // html2canvas re-fetches every <img> itself when snapshotting — that
    // re-fetch silently fails for blob: URLs (e.g. the company logo, loaded
    // as an authenticated blob), leaving them blank in the export even
    // though they render fine on screen. Swap the CLONED <img>s for data:
    // URIs baked from the ORIGINAL, already-loaded elements first.
    onclone: (clonedDoc) => {
      const originalImages = element.querySelectorAll("img");
      const clonedImages = clonedDoc.querySelectorAll("img");
      clonedImages.forEach((clonedImg, i) => {
        const original = originalImages[i];
        if (!original) return;
        const dataUrl = loadedImageToDataUrl(original);
        if (dataUrl) clonedImg.src = dataUrl;
      });
    },
  });

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const printableWidth = pageWidth - A4_MARGIN_MM * 2;
  const printableHeight = pageHeight - A4_MARGIN_MM * 2;

  const fullImgHeight = (canvas.height * printableWidth) / canvas.width;

  if (fullImgHeight <= printableHeight) {
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(imgData, "JPEG", A4_MARGIN_MM, A4_MARGIN_MM, printableWidth, fullImgHeight);
  } else {
    const sliceHeightPx = (canvas.width * printableHeight) / printableWidth;
    let offsetY = 0;
    let pageIndex = 0;

    while (offsetY < canvas.height) {
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.min(sliceHeightPx, canvas.height - offsetY);

      const ctx = sliceCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not create PDF canvas context");
      }

      ctx.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        canvas.width,
        sliceCanvas.height
      );

      const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
      const sliceHeightMm = (sliceCanvas.height * printableWidth) / canvas.width;

      if (pageIndex > 0) {
        pdf.addPage();
      }

      pdf.addImage(sliceData, "JPEG", A4_MARGIN_MM, A4_MARGIN_MM, printableWidth, sliceHeightMm);

      offsetY += sliceHeightPx;
      pageIndex += 1;
    }
  }

  const rawBlob = pdf.output("blob");
  return new Blob([rawBlob], { type: "application/pdf" });
}

export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const blob = await generateElementAsPdfBlob(element);
  const finalName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  downloadPdfBlob(blob, finalName);
}
