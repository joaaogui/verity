import { NextRequest, NextResponse } from "next/server";

const windows = new Map<string, number[]>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, timestamps] of windows) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) windows.delete(key);
    else windows.set(key, filtered);
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

  timestamps.push(now);
  windows.set(key, timestamps);

  return null;
}
