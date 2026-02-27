import type { ValidatorResponse } from "../schemas";

export interface DocumentPart {
  buffer: Buffer;
  mimeType: string;
}

export interface LLMProvider {
  validateDocument(
    parts: DocumentPart[],
    expectation: string
  ): Promise<ValidatorResponse>;
}
