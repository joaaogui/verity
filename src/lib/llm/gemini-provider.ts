import type { DocumentPart, LLMProvider } from "./types";
import type { ValidatorResponse, ClassifyResponse, ExtractResponse } from "../schemas";
import { validatorResponseSchema, classifyResponseSchema, extractResponseSchema } from "../schemas";
import { buildPrompt, buildClassifyPrompt, buildExtractPrompt } from "./prompt";
import { GEMINI_MODEL, getGeminiClient } from "./constants";

const MAX_ATTEMPTS = 2;

function cleanAndParse(text: string): unknown {
  if (!text || text.trim().length === 0) {
    throw new Error("Empty response from LLM");
  }
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  let parsed = JSON.parse(cleaned);
  if (Array.isArray(parsed)) parsed = parsed[0];
  return parsed;
}

function flattenFields(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj.extractedFields && typeof obj.extractedFields === "object") {
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj.extractedFields as Record<string, unknown>)) {
      flat[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
    obj.extractedFields = flat;
  }
  return obj;
}

async function callGemini(dataParts: { inlineData: { mimeType: string; data: string } }[], prompt: string, maxTokens: number) {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [...dataParts, { text: prompt }] }],
    config: { responseMimeType: "application/json", temperature: 0, maxOutputTokens: maxTokens },
  });
  return response.text ?? "";
}

function buildDataParts(parts: DocumentPart[]) {
  return parts.map((part) => ({
    inlineData: { mimeType: part.mimeType, data: part.buffer.toString("base64") },
  }));
}

export class GeminiProvider implements LLMProvider {
  async validateDocument(parts: DocumentPart[], expectation: string): Promise<ValidatorResponse> {
    const prompt = buildPrompt(expectation);
    const dataParts = buildDataParts(parts);
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const text = await callGemini(dataParts, prompt, 1024);
        const parsed = flattenFields(cleanAndParse(text) as Record<string, unknown>);
        return validatorResponseSchema.parse(parsed);
      } catch (e) {
        lastError = e;
        if (attempt < MAX_ATTEMPTS - 1) {
          console.warn(`validateDocument attempt ${attempt + 1} failed, retrying...`);
        }
      }
    }
    throw lastError;
  }

  async classifyDocument(parts: DocumentPart[], expectation: string): Promise<ClassifyResponse> {
    const prompt = buildClassifyPrompt(expectation);
    const dataParts = buildDataParts(parts);
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const text = await callGemini(dataParts, prompt, 256);
        const parsed = cleanAndParse(text);
        return classifyResponseSchema.parse(parsed);
      } catch (e) {
        lastError = e;
        if (attempt < MAX_ATTEMPTS - 1) {
          console.warn(`classifyDocument attempt ${attempt + 1} failed, retrying...`);
        }
      }
    }
    throw lastError;
  }

  async extractFields(parts: DocumentPart[], expectation: string): Promise<ExtractResponse> {
    const prompt = buildExtractPrompt(expectation);
    const dataParts = buildDataParts(parts);
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const text = await callGemini(dataParts, prompt, 1024);
        const parsed = flattenFields(cleanAndParse(text) as Record<string, unknown>);
        return extractResponseSchema.parse(parsed);
      } catch (e) {
        lastError = e;
        if (attempt < MAX_ATTEMPTS - 1) {
          console.warn(`extractFields attempt ${attempt + 1} failed, retrying...`);
        }
      }
    }
    throw lastError;
  }
}
