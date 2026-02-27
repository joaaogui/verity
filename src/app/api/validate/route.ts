import { NextRequest } from "next/server";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/schemas";
import { getLLMProvider } from "@/lib/llm/provider";
import { resizeImageForLLM } from "@/lib/document/image-processor";
import { processPdf } from "@/lib/document/pdf-processor";
import { sanitizeUserInput } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";
import type { DocumentPart } from "@/lib/llm/types";

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function errorEvent(error: string, code: string): string {
  return sseEvent("error", { error, code });
}

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request, 10);
  if (rateLimited) return rateLimited;

  const startTime = Date.now();

  let file: File | null = null;
  let expectation = "";
  let parts: DocumentPart[] = [];
  let truncated = false;

  try {
    const formData = await request.formData();
    file = formData.get("file") as File | null;
    const rawExpectation = formData.get("expectation") as string | null;

    if (!file) {
      return new Response(errorEvent("No file provided", "validation_error"), {
        headers: { "Content-Type": "text/event-stream" },
      });
    }

    expectation = sanitizeUserInput(rawExpectation ?? "");
    if (!expectation) {
      return new Response(errorEvent("Expectation is required", "validation_error"), {
        headers: { "Content-Type": "text/event-stream" },
      });
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type as (typeof ACCEPTED_FILE_TYPES)[number])) {
      return new Response(
        errorEvent(`Unsupported file type: ${file.type}. Accepted: PDF, JPG, PNG, WebP`, "validation_error"),
        { headers: { "Content-Type": "text/event-stream" } }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return new Response(
        errorEvent(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`, "validation_error"),
        { headers: { "Content-Type": "text/event-stream" } }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    if (file.type === "application/pdf") {
      const pdfResult = await processPdf(fileBuffer);
      truncated = pdfResult.truncated;
      parts = [{ buffer: pdfResult.buffer, mimeType: "application/pdf" }];
    } else {
      const resized = await resizeImageForLLM(fileBuffer);
      parts = [{ buffer: resized, mimeType: "image/jpeg" }];
    }
  } catch {
    return new Response(errorEvent("An unexpected error occurred.", "unknown"), {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const encoder = new TextEncoder();
  const provider = getLLMProvider();
  const capturedParts = parts;
  const capturedExpectation = expectation;
  const capturedTruncated = truncated;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const verdict = await provider.classifyDocument(capturedParts, capturedExpectation);
        const verdictTimeMs = Date.now() - startTime;
        controller.enqueue(
          encoder.encode(sseEvent("verdict", { ...verdict, processingTimeMs: verdictTimeMs, truncated: capturedTruncated }))
        );

        try {
          const fields = await provider.extractFields(capturedParts, capturedExpectation);
          const totalTimeMs = Date.now() - startTime;
          controller.enqueue(
            encoder.encode(sseEvent("complete", { ...fields, processingTimeMs: totalTimeMs }))
          );
        } catch {
          controller.enqueue(
            encoder.encode(sseEvent("complete", { extractedFields: {}, summary: "Field extraction was not available for this document. The classification above is still valid.", processingTimeMs: Date.now() - startTime }))
          );
        }
      } catch {
        controller.enqueue(
          encoder.encode(errorEvent("Failed to classify document. Please try again.", "parse_error"))
        );
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
