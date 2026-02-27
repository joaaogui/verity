import type { ValidatorResponse } from "../schemas";

export interface LLMProvider {
  validateDocument(
    images: Buffer[],
    expectation: string
  ): Promise<ValidatorResponse>;
}
