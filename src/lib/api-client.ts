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

function parseSseBlock(block: string): { eventType: string; eventData: string } | null {
  let eventType = "";
  let eventData = "";

  for (const line of block.split("\n")) {
    if (line.startsWith("event: ")) eventType = line.slice(7);
    else if (line.startsWith("data: ")) eventData = line.slice(6);
  }

  return eventType && eventData ? { eventType, eventData } : null;
}

function toStreamEvent(eventType: string, data: unknown): StreamEvent | null {
  const eventMap: Record<string, StreamEvent["type"]> = {
    verdict: "verdict",
    complete: "complete",
    error: "error",
  };
  const type = eventMap[eventType];
  if (!type) return null;
  return { type, data } as StreamEvent;
}

function parseBlockToEvent(block: string): StreamEvent | null {
  if (!block.trim()) return null;

  const parsed = parseSseBlock(block);
  if (!parsed) return null;

  try {
    const data = JSON.parse(parsed.eventData);
    return toStreamEvent(parsed.eventType, data);
  } catch {
    return null;
  }
}

async function* readSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const block of chunks) {
      const event = parseBlockToEvent(block);
      if (event) yield event;
    }
  }
}

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

  yield* readSseStream(response.body);
}

export type ApiError = {
  error: string;
};
