import type { ValidatorResponse } from "./schemas";

export type ValidateResult = ValidatorResponse & {
  processingTimeMs: number;
  truncated: boolean;
};

export type ApiError = {
  error: string;
};

export async function validateDocument(
  file: File,
  expectation: string
): Promise<ValidateResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("expectation", expectation);

  const response = await fetch("/api/validate", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body: ApiError = await response.json();
    throw new Error(body.error || "Validation failed");
  }

  return response.json();
}
