import { PDFDocument } from "pdf-lib";
import { MAX_PAGES } from "../schemas";

export async function processPdf(
  pdfBuffer: Buffer
): Promise<{ pageCount: number; truncated: boolean }> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pageCount = doc.getPageCount();
  return {
    pageCount: Math.min(pageCount, MAX_PAGES),
    truncated: pageCount > MAX_PAGES,
  };
}
