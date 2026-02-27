import pdfParse from "pdf-parse";
import { MAX_PAGES } from "../schemas";

export interface ProcessedDocument {
  type: "pdf" | "image";
  buffers: Buffer[];
  pageCount: number;
  truncated: boolean;
}

export async function processPdf(
  pdfBuffer: Buffer
): Promise<{ pageCount: number; truncated: boolean }> {
  const data = await pdfParse(pdfBuffer);
  const pageCount = data.numpages;
  return {
    pageCount: Math.min(pageCount, MAX_PAGES),
    truncated: pageCount > MAX_PAGES,
  };
}
