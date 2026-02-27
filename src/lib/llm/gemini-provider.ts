import type { DocumentPart, LLMProvider } from "./types";
import type { ValidatorResponse } from "../schemas";
import { validatorResponseSchema } from "../schemas";
import { buildPrompt } from "./prompt";
import { GEMINI_MODEL, getGeminiClient } from "./constants";

const MAX_ATTEMPTS = 2;

function normalizeResponse(raw: unknown): ValidatorResponse {
  let parsed = raw;
  if (Array.isArray(parsed)) parsed = parsed[0];

  const obj = parsed as Record<string, unknown>;
  if (obj.extractedFields && typeof obj.extractedFields === "object") {
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj.extractedFields as Record<string, unknown>)) {
      flat[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
    obj.extractedFields = flat;
  }

  return validatorResponseSchema.parse(obj);
}

export class GeminiProvider implements LLMProvider {
  async validateDocument(
    parts: DocumentPart[],
    expectation: string
  ): Promise<ValidatorResponse> {
    const prompt = buildPrompt(expectation);
    const client = getGeminiClient();

    const dataParts = parts.map((part) => ({
      inlineData: {
        mimeType: part.mimeType,
        data: part.buffer.toString("base64"),
      },
    }));

    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const response = await client.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            {
              role: "user",
              parts: [...dataParts, { text: prompt }],
            },
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0,
            maxOutputTokens: 1024,
          },
        });

        const text = response.text ?? "";
        const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
        const parsed = JSON.parse(cleaned);
        return normalizeResponse(parsed);
      } catch (e) {
        lastError = e;
        if (attempt < MAX_ATTEMPTS - 1) {
          console.warn(`Attempt ${attempt + 1} failed, retrying...`, e instanceof Error ? e.message : e);
        }
      }
    }

    throw lastError;
  }
}
