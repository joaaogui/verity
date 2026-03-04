import { NextRequest, NextResponse } from "next/server";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/schemas";
import { getLLMProvider } from "@/lib/llm/provider";
import { resizeImageForLLM } from "@/lib/document/image-processor";
import { processPdf } from "@/lib/document/pdf-processor";
import type { DocumentPart } from "@/lib/llm/types";

const ADDRESS_EXTRACTION_PROMPT = `address verification document - Extract the following address fields from this document:
- full_name (the person's name)
- street_address (full street address)
- city
- state
- zip_code (postal code)
- country

Return ALL fields even if some are empty strings. Be thorough and extract the most complete address information visible.`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type as (typeof ACCEPTED_FILE_TYPES)[number])) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File exceeds ${MAX_FILE_SIZE_MB}MB limit` },
        { status: 400 },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let parts: DocumentPart[];

    if (file.type === "application/pdf") {
      const pdfResult = await processPdf(fileBuffer);
      parts = [{ buffer: pdfResult.buffer, mimeType: "application/pdf" }];
    } else {
      const resized = await resizeImageForLLM(fileBuffer);
      parts = [{ buffer: resized, mimeType: "image/jpeg" }];
    }

    const provider = getLLMProvider();
    const result = await provider.extractFields(parts, ADDRESS_EXTRACTION_PROMPT);

    const fields = result.extractedFields;
    return NextResponse.json({
      fullName: fields.full_name ?? fields.name ?? "",
      streetAddress: fields.street_address ?? fields.address ?? "",
      city: fields.city ?? "",
      state: fields.state ?? fields.province ?? "",
      zipCode: fields.zip_code ?? fields.postal_code ?? "",
      country: fields.country ?? "",
    });
  } catch (e) {
    console.error("Meridial extract error:", e);
    return NextResponse.json(
      { error: "Failed to extract address from document" },
      { status: 500 },
    );
  }
}
