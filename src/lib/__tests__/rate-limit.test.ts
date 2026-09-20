import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit } from "../rate-limit";

function request(path: string, ip: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: { "x-forwarded-for": ip },
  });
}

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Each IP/path key is independent; use unique IPs per test to avoid bleed.
  });

  it("allows requests under the limit", () => {
    const ip = `rate-ok-${Date.now()}`;
    expect(checkRateLimit(request("/api/validate", ip), 3)).toBeNull();
    expect(checkRateLimit(request("/api/validate", ip), 3)).toBeNull();
  });

  it("returns 429 after exceeding maxRequests", async () => {
    const ip = `rate-block-${Date.now()}`;
    expect(checkRateLimit(request("/api/meridial/extract", ip), 2)).toBeNull();
    expect(checkRateLimit(request("/api/meridial/extract", ip), 2)).toBeNull();
    const limited = checkRateLimit(request("/api/meridial/extract", ip), 2);
    expect(limited).not.toBeNull();
    expect(limited!.status).toBe(429);
    const body = await limited!.json();
    expect(body.code).toBe("rate_limit");
  });

  it("tracks different paths separately", () => {
    const ip = `rate-paths-${Date.now()}`;
    expect(checkRateLimit(request("/api/validate", ip), 1)).toBeNull();
    expect(checkRateLimit(request("/api/suggest", ip), 1)).toBeNull();
    expect(checkRateLimit(request("/api/validate", ip), 1)).not.toBeNull();
  });

  it("evicts old clients instead of growing beyond the tracked-key cap", () => {
    const path = `/api/cap-${Date.now()}`;
    const oldestIp = `oldest-${Date.now()}`;

    expect(checkRateLimit(request(path, oldestIp), 1)).toBeNull();
    expect(checkRateLimit(request(path, oldestIp), 1)).not.toBeNull();

    for (let index = 0; index <= 5_000; index += 1) {
      expect(
        checkRateLimit(request(path, `client-${Date.now()}-${index}`), 1),
      ).toBeNull();
    }

    // If the oldest key was evicted, it gets a fresh allowance.
    expect(checkRateLimit(request(path, oldestIp), 1)).toBeNull();
  });
});
