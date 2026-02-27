"use server";

import fs from "fs";
import path from "path";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/schemas";
import { getLLMProvider } from "@/lib/llm/provider";
import { resizeImageForLLM } from "@/lib/document/image-processor";
import { processPdf } from "@/lib/document/pdf-processor";
import type { DocumentPart } from "@/lib/llm/types";

export interface TestResult {
  id: string;
  matchesExpectation: boolean;
  category: string;
  confidence: number;
  matchExplanation: string;
  processingTimeMs: number;
  error?: string;
}

export async function runTestCase(
  id: string,
  filePath: string,
  expectation: string
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return { id, matchesExpectation: false, category: "", confidence: 0, matchExplanation: "", processingTimeMs: 0, error: `File not found: ${filePath}` };
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : "image/jpeg";

    if (!ACCEPTED_FILE_TYPES.includes(mimeType as (typeof ACCEPTED_FILE_TYPES)[number])) {
      return { id, matchesExpectation: false, category: "", confidence: 0, matchExplanation: "", processingTimeMs: 0, error: "Unsupported file type" };
    }

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      return { id, matchesExpectation: false, category: "", confidence: 0, matchExplanation: "", processingTimeMs: 0, error: "File too large" };
    }

    let parts: DocumentPart[];

    if (mimeType === "application/pdf") {
      const pdfResult = await processPdf(fileBuffer);
      parts = [{ buffer: pdfResult.buffer, mimeType: "application/pdf" }];
    } else {
      const resized = await resizeImageForLLM(fileBuffer);
      parts = [{ buffer: resized, mimeType: "image/jpeg" }];
    }

    const provider = getLLMProvider();
    const result = await provider.validateDocument(parts, expectation);
    const processingTimeMs = Date.now() - startTime;

    return {
      id,
      matchesExpectation: result.matchesExpectation,
      category: result.categoryLabel,
      confidence: result.confidence,
      matchExplanation: result.matchExplanation,
      processingTimeMs,
    };
  } catch (e) {
    return {
      id,
      matchesExpectation: false,
      category: "",
      confidence: 0,
      matchExplanation: "",
      processingTimeMs: Date.now() - startTime,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
