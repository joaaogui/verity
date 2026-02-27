import { MAX_PAGES } from "../schemas";

export interface ProcessedDocument {
  type: "pdf" | "image";
  buffers: Buffer[];
  pageCount: number;
  truncated: boolean;
}

const PAGE_MARKER = /\/Type\s*\/Page(?!s)/g;

export async function processPdf(
  pdfBuffer: Buffer
): Promise<{ pageCount: number; truncated: boolean }> {
  const raw = pdfBuffer.toString("latin1");
  const matches = raw.match(PAGE_MARKER);
  const pageCount = matches ? matches.length : 1;
  return {
    pageCount: Math.min(pageCount, MAX_PAGES),
    truncated: pageCount > MAX_PAGES,
  };
}
