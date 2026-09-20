import { afterEach, describe, expect, it, vi } from "vitest";
import { validateDocumentStream } from "../api-client";

describe("validateDocumentStream", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws a clear error for JSON 429 without parsing as SSE", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "content-type" ? "application/json" : null,
        },
        json: async () => ({
          error: "Too many requests. Please try again later.",
          code: "rate_limit",
        }),
        body: null,
      }),
    );

    const file = new File(["x"], "doc.png", { type: "image/png" });
    const iterator = validateDocumentStream(file, "an invoice");
    await expect(iterator.next()).rejects.toThrow(/Too many requests/i);
  });

  it("surfaces JSON error messages on non-ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "content-type" ? "application/json" : null,
        },
        json: async () => ({ error: "Expectation is required" }),
        body: null,
      }),
    );

    const file = new File(["x"], "doc.png", { type: "image/png" });
    await expect(
      validateDocumentStream(file, "").next(),
    ).rejects.toThrow("Expectation is required");
  });

  it("rejects unexpected non-SSE success content types", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "content-type" ? "application/json" : null,
        },
        body: null,
      }),
    );

    const file = new File(["x"], "doc.png", { type: "image/png" });
    await expect(
      validateDocumentStream(file, "a passport").next(),
    ).rejects.toThrow(/Unexpected response/i);
  });
});
