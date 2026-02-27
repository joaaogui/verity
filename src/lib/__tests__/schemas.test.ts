import { describe, it, expect } from "vitest";
import { validatorResponseSchema, type ValidatorResponse } from "../schemas";

describe("validatorResponseSchema", () => {
  it("parses a valid response", () => {
    const input = {
      category: "utility_bill",
      categoryLabel: "Utility Bill",
      confidence: 0.95,
      matchesExpectation: true,
      matchExplanation: "Document is an electricity bill matching the expectation.",
      extractedFields: {
        provider: "ConEd",
        date: "2026-01-15",
        amount: "$142.50",
      },
      summary: "Electricity bill from ConEd dated January 2026.",
    };

    const result: ValidatorResponse = validatorResponseSchema.parse(input);
    expect(result.category).toBe("utility_bill");
    expect(result.confidence).toBe(0.95);
    expect(result.matchesExpectation).toBe(true);
  });

  it("rejects confidence outside 0-1 range", () => {
    const input = {
      category: "utility_bill",
      categoryLabel: "Utility Bill",
      confidence: 1.5,
      matchesExpectation: true,
      matchExplanation: "Matches.",
      extractedFields: {},
      summary: "A bill.",
    };

    expect(() => validatorResponseSchema.parse(input)).toThrow();
  });

  it("rejects missing required fields", () => {
    const input = {
      category: "utility_bill",
    };

    expect(() => validatorResponseSchema.parse(input)).toThrow();
  });
});
