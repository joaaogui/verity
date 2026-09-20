import { headers } from "next/headers";

/**
 * Basic-auth gate for the /tests suite.
 * - Production: TESTS_BASIC_AUTH (username:password) required; missing → deny.
 * - Development: open if TESTS_BASIC_AUTH is unset (local DX).
 */
export function isTestsAuthConfigured(): boolean {
  return Boolean(process.env.TESTS_BASIC_AUTH?.includes(":"));
}

function constantTimeEqual(left: string, right: string): boolean {
  let mismatch = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

export function verifyTestsBasicAuthHeader(authorization: string | null): boolean {
  const creds = process.env.TESTS_BASIC_AUTH;
  if (!creds?.includes(":")) {
    return process.env.NODE_ENV !== "production";
  }
  if (!authorization?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(authorization.slice(6));
    return constantTimeEqual(decoded, creds);
  } catch {
    return false;
  }
}

export async function assertTestsAuthorized(): Promise<
  { ok: true } | { ok: false; status: 401 | 404 }
> {
  const creds = process.env.TESTS_BASIC_AUTH;
  if (!creds?.includes(":")) {
    if (process.env.NODE_ENV !== "production") return { ok: true };
    return { ok: false, status: 404 };
  }

  const h = await headers();
  if (verifyTestsBasicAuthHeader(h.get("authorization"))) {
    return { ok: true };
  }
  return { ok: false, status: 401 };
}
