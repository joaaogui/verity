"use server";

import fs from "node:fs";
import path from "node:path";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/schemas";
import { getLLMProvider } from "@/lib/llm/provider";
import { resizeImageForLLM } from "@/lib/document/image-processor";
import { processPdf } from "@/lib/document/pdf-processor";
import { assertTestsAuthorized } from "@/lib/tests-auth";
import { resolveFixturePath } from "@/lib/test-fixtures";
import type { DocumentPart } from "@/lib/llm/types";
import { TEST_CASES } from "./test-cases";

export interface TestResult {
  id: string;
  matchesExpectation: boolean;
  category: string;
  confidence: number;
  matchExplanation: string;
  processingTimeMs: number;
  error?: string;
}

function emptyResult(id: string, error: string, processingTimeMs = 0): TestResult {
  return {
    id,
    matchesExpectation: false,
    category: "",
    confidence: 0,
    matchExplanation: "",
    processingTimeMs,
    error,
  };
}

export async function runTestCase(id: string): Promise<TestResult> {
  const auth = await assertTestsAuthorized();
  if (!auth.ok) {
    return emptyResult(id, auth.status === 404 ? "Not found" : "Unauthorized");
  }

  const startTime = Date.now();
  const testCase = TEST_CASES.find((tc) => tc.id === id);
  if (!testCase) {
    return emptyResult(id, "Unknown test case");
  }

  try {
    const fullPath = resolveFixturePath(testCase.file);
    if (!fullPath || !fs.existsSync(fullPath)) {
      return emptyResult(id, "Fixture not found", Date.now() - startTime);
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };
    const mimeType = mimeMap[ext] ?? "image/jpeg";

    if (!ACCEPTED_FILE_TYPES.includes(mimeType as (typeof ACCEPTED_FILE_TYPES)[number])) {
      return emptyResult(id, "Unsupported file type", Date.now() - startTime);
    }

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      return emptyResult(id, "File too large", Date.now() - startTime);
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
    const result = await provider.classifyDocument(parts, testCase.expectation);
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
    return emptyResult(
      id,
      e instanceof Error ? e.message : "Unknown error",
      Date.now() - startTime
    );
  }
}
