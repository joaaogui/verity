import type { DocumentPart, LLMProvider } from "./types";
import type { ValidatorResponse } from "../schemas";
import { validatorResponseSchema } from "../schemas";
import { buildPrompt } from "./prompt";
import { GEMINI_MODEL, getGeminiClient } from "./constants";

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
    let parsed = JSON.parse(text);
    if (Array.isArray(parsed)) parsed = parsed[0];

    if (parsed.extractedFields && typeof parsed.extractedFields === "object") {
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed.extractedFields)) {
        flat[k] = typeof v === "string" ? v : JSON.stringify(v);
      }
      parsed.extractedFields = flat;
    }

    return validatorResponseSchema.parse(parsed);
  }
}
