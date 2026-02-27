import type { ValidatorResponse, ClassifyResponse, ExtractResponse } from "../schemas";

export interface DocumentPart {
  buffer: Buffer;
  mimeType: string;
}

export interface LLMProvider {
  validateDocument(parts: DocumentPart[], expectation: string): Promise<ValidatorResponse>;
  classifyDocument(parts: DocumentPart[], expectation: string): Promise<ClassifyResponse>;
  extractFields(parts: DocumentPart[], expectation: string): Promise<ExtractResponse>;
}
