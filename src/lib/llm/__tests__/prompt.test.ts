import { describe, it, expect } from "vitest";
import { buildPrompt } from "../prompt";

describe("buildPrompt", () => {
  it("includes the user expectation in the prompt", () => {
    const result = buildPrompt("A recent electricity bill from ConEd");
    expect(result).toContain("A recent electricity bill from ConEd");
  });

  it("requests JSON output format", () => {
    const result = buildPrompt("Any document");
    expect(result).toContain("JSON");
  });

  it("includes all required output fields", () => {
    const result = buildPrompt("Any document");
    expect(result).toContain("category");
    expect(result).toContain("confidence");
    expect(result).toContain("matchesExpectation");
    expect(result).toContain("extractedFields");
    expect(result).toContain("summary");
  });
});
