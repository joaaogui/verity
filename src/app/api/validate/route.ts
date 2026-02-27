import { NextRequest, NextResponse } from "next/server";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/schemas";
import { getLLMProvider } from "@/lib/llm/provider";
import { resizeImageForLLM } from "@/lib/document/image-processor";
import { processPdf } from "@/lib/document/pdf-processor";
import { sanitizeUserInput } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";
import type { DocumentPart } from "@/lib/llm/types";

function errorResponse(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request, 10);
  if (rateLimited) return rateLimited;

  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawExpectation = formData.get("expectation") as string | null;

    if (!file) {
      return errorResponse("No file provided", "validation_error", 400);
    }

    const expectation = sanitizeUserInput(rawExpectation ?? "");
    if (!expectation) {
      return errorResponse("Expectation is required", "validation_error", 400);
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type as (typeof ACCEPTED_FILE_TYPES)[number])) {
      return errorResponse(
        `Unsupported file type: ${file.type}. Accepted: PDF, JPG, PNG, WebP`,
        "validation_error",
        400
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse(
        `File exceeds ${MAX_FILE_SIZE_MB}MB limit`,
        "validation_error",
        400
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let parts: DocumentPart[];
    let truncated = false;

    if (file.type === "application/pdf") {
      const pdfResult = await processPdf(fileBuffer);
      truncated = pdfResult.truncated;
      parts = [{ buffer: pdfResult.buffer, mimeType: "application/pdf" }];
    } else {
      const resized = await resizeImageForLLM(fileBuffer);
      parts = [{ buffer: resized, mimeType: "image/jpeg" }];
    }

    const provider = getLLMProvider();
    const result = await provider.validateDocument(parts, expectation);

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json({
      ...result,
      processingTimeMs,
      truncated,
    });
  } catch (error) {
    console.error("Validation error:", error);

    if (error instanceof SyntaxError) {
      return errorResponse(
        "Failed to parse AI response. Please try again.",
        "parse_error",
        502
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("API key") || message.includes("401") || message.includes("403")) {
      return errorResponse("AI service configuration error.", "provider_error", 502);
    }

    if (message.includes("429") || message.includes("quota")) {
      return errorResponse("AI service rate limit exceeded. Try again shortly.", "provider_error", 502);
    }

    return errorResponse(
      "An unexpected error occurred. Please try again.",
      "unknown",
      500
    );
  }
}
