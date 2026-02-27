import type { LLMProvider } from "./types";
import { GeminiProvider } from "./gemini-provider";

export function getLLMProvider(): LLMProvider {
  return new GeminiProvider();
}
