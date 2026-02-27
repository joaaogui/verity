import type { ValidatorResponse, ClassifyResponse, ExtractResponse } from "./schemas";

export type VerdictResult = ClassifyResponse & {
  processingTimeMs: number;
  truncated: boolean;
};

export type FieldsResult = ExtractResponse & {
  processingTimeMs: number;
};

export type ValidateResult = ValidatorResponse & {
  processingTimeMs: number;
  truncated: boolean;
};

export type StreamEvent =
  | { type: "verdict"; data: VerdictResult }
  | { type: "complete"; data: FieldsResult }
  | { type: "error"; data: { error: string; code: string } };

export async function* validateDocumentStream(
  file: File,
  expectation: string
): AsyncGenerator<StreamEvent> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("expectation", expectation);

  const response = await fetch("/api/validate", {
    method: "POST",
    body: formData,
  });

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const block of events) {
      if (!block.trim()) continue;

      let eventType = "";
      let eventData = "";

      for (const line of block.split("\n")) {
        if (line.startsWith("event: ")) eventType = line.slice(7);
        else if (line.startsWith("data: ")) eventData = line.slice(6);
      }

      if (!eventType || !eventData) continue;

      try {
        const parsed = JSON.parse(eventData);

        if (eventType === "verdict") {
          yield { type: "verdict", data: parsed as VerdictResult };
        } else if (eventType === "complete") {
          yield { type: "complete", data: parsed as FieldsResult };
        } else if (eventType === "error") {
          yield { type: "error", data: parsed };
        }
      } catch {
        // skip malformed events
      }
    }
  }
}

export type ApiError = {
  error: string;
};
