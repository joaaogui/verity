import { PDFDocument } from "pdf-lib";
import { MAX_PAGES } from "../schemas";

export interface PdfProcessResult {
  buffer: Buffer;
  pageCount: number;
  truncated: boolean;
}

export async function processPdf(pdfBuffer: Buffer): Promise<PdfProcessResult> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();
  const truncated = totalPages > MAX_PAGES;

  if (!truncated) {
    return { buffer: pdfBuffer, pageCount: totalPages, truncated: false };
  }

  const trimmed = await PDFDocument.create();
  const pages = await trimmed.copyPages(doc, Array.from({ length: MAX_PAGES }, (_, i) => i));
  for (const page of pages) {
    trimmed.addPage(page);
  }
  const trimmedBytes = await trimmed.save();

  return {
    buffer: Buffer.from(trimmedBytes),
    pageCount: MAX_PAGES,
    truncated: true,
  };
}
