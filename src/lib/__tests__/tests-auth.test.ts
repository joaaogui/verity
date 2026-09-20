import { afterEach, describe, expect, it, vi } from "vitest";
import { headers } from "next/headers";
import {
  assertTestsAuthorized,
  isTestsAuthConfigured,
  verifyTestsBasicAuthHeader,
} from "../tests-auth";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

describe("tests-auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(headers).mockReset();
  });

  it("reports configured when TESTS_BASIC_AUTH has user:pass", () => {
    vi.stubEnv("TESTS_BASIC_AUTH", "tester:secret");
    expect(isTestsAuthConfigured()).toBe(true);
  });

  it("reports not configured without a colon", () => {
    vi.stubEnv("TESTS_BASIC_AUTH", "incomplete");
    expect(isTestsAuthConfigured()).toBe(false);
  });

  it("accepts a matching Basic header", () => {
    vi.stubEnv("TESTS_BASIC_AUTH", "tester:secret");
    const header = `Basic ${btoa("tester:secret")}`;
    expect(verifyTestsBasicAuthHeader(header)).toBe(true);
  });

  it("rejects a wrong Basic header", () => {
    vi.stubEnv("TESTS_BASIC_AUTH", "tester:secret");
    const header = `Basic ${btoa("tester:wrong")}`;
    expect(verifyTestsBasicAuthHeader(header)).toBe(false);
  });

  it("rejects missing Authorization when creds are set", () => {
    vi.stubEnv("TESTS_BASIC_AUTH", "tester:secret");
    expect(verifyTestsBasicAuthHeader(null)).toBe(false);
  });

  it("returns 404 in production when auth is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TESTS_BASIC_AUTH", "");

    await expect(assertTestsAuthorized()).resolves.toEqual({
      ok: false,
      status: 404,
    });
    expect(headers).not.toHaveBeenCalled();
  });

  it("returns 401 for a wrong configured credential", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TESTS_BASIC_AUTH", "tester:secret");
    vi.mocked(headers).mockResolvedValue(
      new Headers({
        authorization: `Basic ${btoa("tester:wrong")}`,
      }) as Awaited<ReturnType<typeof headers>>,
    );

    await expect(assertTestsAuthorized()).resolves.toEqual({
      ok: false,
      status: 401,
    });
  });

  it("authorizes a matching configured credential", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TESTS_BASIC_AUTH", "tester:secret");
    vi.mocked(headers).mockResolvedValue(
      new Headers({
        authorization: `Basic ${btoa("tester:secret")}`,
      }) as Awaited<ReturnType<typeof headers>>,
    );

    await expect(assertTestsAuthorized()).resolves.toEqual({ ok: true });
  });
});
