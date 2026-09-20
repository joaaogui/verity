import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveFixturePath } from "../test-fixtures";

const ROOT = path.resolve("/tmp/verity-fixtures");

describe("resolveFixturePath", () => {
  it("resolves a relative fixture under the root", () => {
    const resolved = resolveFixturePath("invoice.pdf", ROOT);
    expect(resolved).toBe(path.resolve(ROOT, "invoice.pdf"));
  });

  it("strips a test-docs/ prefix", () => {
    const resolved = resolveFixturePath("test-docs/nested/doc.png", ROOT);
    expect(resolved).toBe(path.resolve(ROOT, "nested/doc.png"));
  });

  it("rejects parent-directory traversal", () => {
    expect(resolveFixturePath("../secret.env", ROOT)).toBeNull();
    expect(resolveFixturePath("a/../../etc/passwd", ROOT)).toBeNull();
  });

  it("rejects absolute paths", () => {
    expect(resolveFixturePath("/etc/passwd", ROOT)).toBeNull();
  });

  it("rejects null bytes", () => {
    expect(resolveFixturePath("evil\0.pdf", ROOT)).toBeNull();
  });
});
