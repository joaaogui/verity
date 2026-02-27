import { GoogleGenAI } from "@google/genai";
import type { LLMProvider } from "./types";
import type { ValidatorResponse } from "../schemas";
import { validatorResponseSchema } from "../schemas";
import { buildPrompt } from "./prompt";

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenAI;
  private model = "gemini-2.0-flash";

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async validateDocument(
    images: Buffer[],
    expectation: string
  ): Promise<ValidatorResponse> {
    const prompt = buildPrompt(expectation);

    const imageParts = images.map((img) => ({
      inlineData: {
        mimeType: "image/png" as const,
        data: img.toString("base64"),
      },
    }));

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: "user",
          parts: [...imageParts, { text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "";
    const parsed = JSON.parse(text);
    return validatorResponseSchema.parse(parsed);
  }
}
