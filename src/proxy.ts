import { NextRequest, NextResponse } from "next/server";
import { verifyTestsBasicAuthHeader } from "@/lib/tests-auth";

export function proxy(request: NextRequest) {
  const creds = process.env.TESTS_BASIC_AUTH;
  if (!creds?.includes(":")) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.next();
    }
    return new NextResponse(null, { status: 404 });
  }

  if (verifyTestsBasicAuthHeader(request.headers.get("authorization"))) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Verity Tests", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/tests", "/tests/:path*"],
};
