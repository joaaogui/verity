import { NextRequest, NextResponse } from "next/server";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/schemas";
import { getLLMProvider } from "@/lib/llm/provider";
import { resizeImageForLLM } from "@/lib/document/image-processor";
import { processPdf } from "@/lib/document/pdf-processor";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const expectation = formData.get("expectation") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!expectation?.trim()) {
      return NextResponse.json(
        { error: "Expectation is required" },
        { status: 400 }
      );
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type as (typeof ACCEPTED_FILE_TYPES)[number])) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Accepted: PDF, JPG, PNG, WebP` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File exceeds ${MAX_FILE_SIZE_MB}MB limit` },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let images: Buffer[];
    let truncated = false;

    if (file.type === "application/pdf") {
      const pdfInfo = await processPdf(fileBuffer);
      truncated = pdfInfo.truncated;
      images = [fileBuffer];
    } else {
      const resized = await resizeImageForLLM(fileBuffer);
      images = [resized];
    }

    const provider = getLLMProvider();
    const result = await provider.validateDocument(images, expectation.trim());

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json({
      ...result,
      processingTimeMs,
      truncated,
    });
  } catch (error) {
    console.error("Validation error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
