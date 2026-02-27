import type { LLMProvider } from "./types";
import { GeminiProvider } from "./gemini-provider";

let providerInstance: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (providerInstance) return providerInstance;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  providerInstance = new GeminiProvider(apiKey);
  return providerInstance;
}
