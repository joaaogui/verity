import { z } from "zod";

export const classifyResponseSchema = z.object({
  category: z.string().min(1),
  categoryLabel: z.string().min(1),
  confidence: z.number().min(0).max(1),
  matchesExpectation: z.boolean(),
  matchExplanation: z.string().min(1),
});

export type ClassifyResponse = z.infer<typeof classifyResponseSchema>;

export const extractResponseSchema = z.object({
  extractedFields: z.record(z.string(), z.string()),
  summary: z.string().min(1),
});

export type ExtractResponse = z.infer<typeof extractResponseSchema>;

export const validatorResponseSchema = classifyResponseSchema.merge(extractResponseSchema);

export type ValidatorResponse = z.infer<typeof validatorResponseSchema>;

export const validateRequestSchema = z.object({
  expectation: z.string().min(1, "Expectation is required"),
});

export type ValidateRequest = z.infer<typeof validateRequestSchema>;

export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_PAGES = 3;
