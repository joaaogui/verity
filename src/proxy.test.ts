import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

function testsRequest(authorization?: string) {
  return new NextRequest("http://localhost/tests", {
    headers: authorization ? { authorization } : undefined,
  });
}

describe("tests proxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("challenges requests without credentials when auth is configured", () => {
    vi.stubEnv("TESTS_BASIC_AUTH", "tester:secret");

    const response = proxy(testsRequest());

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("Basic");
  });

  it("passes through matching Basic credentials", () => {
    vi.stubEnv("TESTS_BASIC_AUTH", "tester:secret");

    const response = proxy(
      testsRequest(`Basic ${btoa("tester:secret")}`),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
