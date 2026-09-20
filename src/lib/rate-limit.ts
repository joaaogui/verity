import { NextRequest, NextResponse } from "next/server";

const windows = new Map<string, number[]>();

/** Cap in-memory keys so a flood of unique IPs cannot grow the Map unboundedly. */
const MAX_TRACKED_KEYS = 5_000;
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL && windows.size <= MAX_TRACKED_KEYS) {
    return;
  }
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, timestamps] of windows) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) windows.delete(key);
    else windows.set(key, filtered);
  }

  while (windows.size > MAX_TRACKED_KEYS) {
    const oldest = windows.keys().next().value;
    if (oldest === undefined) break;
    windows.delete(oldest);
  }
}

function getIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function checkRateLimit(
  request: NextRequest,
  maxRequests: number,
  windowMs = 60_000
): NextResponse | null {
  const ip = getIP(request);
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  cleanup(windowMs);

  const timestamps = (windows.get(key) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= maxRequests) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", code: "rate_limit" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) },
      }
    );
  }

  if (!windows.has(key) && windows.size >= MAX_TRACKED_KEYS) {
    const oldest = windows.keys().next().value;
    if (oldest !== undefined) windows.delete(oldest);
  }

  timestamps.push(now);
  windows.set(key, timestamps);

  return null;
}
